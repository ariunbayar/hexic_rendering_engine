unless d3?
  console.log "d3.js is not included. Consult with d3js.org"
  return
unless Backbone?
  console.log "backbone.js is not included. Consult with backbonejs.org"
  return

Cache =
  get: (key, default_value) ->
    if key of @ then @[key] else default_value

  set: (key, value) ->
    @[key] = value

  call: (key, func, context) ->
    unless key of @
      @[key] = func.apply(context, Array.prototype.slice.call(arguments, 3))
    @[key]

Graphics =
  board_offset: {x: 30, y: 30}

  touch_detected: false
  mouse_detected: false
  rollback_queue: []

  rollbackActions: ->
    while item = @rollback_queue.shift()
      [func, context, args] = item
      if args
        func.apply(context, args)
      else
        func.call(context)

  createSVG: (container_selector, width, height) ->
    svg = d3.select(container_selector).append('svg')
      .attr('width', width)
      .attr('height', height)
    svg.on('touchstart', ->
      svg.on('mousemove', null)
      svg.on('touchstart', null)
      Graphics.touch_detected = true
    ).on('mousemove', ->
      svg.on('mousemove', null)
      svg.on('touchstart', null)
      Graphics.mouse_detected = true
    ).on('contextmenu', ->
      d3.event.preventDefault()
    )
    # TODO make sure following events run for each client
    self = @
    window.addEventListener('blur', -> self.rollbackActions.call(self))
    window.addEventListener('mouseup', -> self.rollbackActions.call(self))

    # TODO remove. Debug only
    svg.append('circle')
      .attr('id', 'debug_el')
      .attr('r', 3)
      .attr('cx', 0)
      .attr('cy', 0)
    return svg

  Cell: Backbone.Model.extend({
    initialize: ->
      # required attrs: svg, color, coord
      @initCoord()
      @initContainer()
      @initCircle()
      @initArc()
      @initHexagon()
      @initArrow()
      @initTmpArrow()
      @on('change:power', @changedPower, @)
      @on('change:color', @changedColor, @)
      @on('change:direction', @changedDirection, @)

    initCoord: ->
      coord = @get('coord')
      sin_60 = Math.sin(Math.PI / 3)
      offset_x = 2 * 30 * sin_60
      offset_y = 2 * 30 * sin_60 * sin_60
      shift_x = if coord.y % 2 then 0 else offset_x / 2
      coord.x = coord.x * offset_x + Graphics.board_offset.x + shift_x
      coord.y = coord.y * offset_y + Graphics.board_offset.y
      @set('coord', coord)

    initContainer: ->
      container = @get('svg').append('g')
      coord = @get('coord')
      container.attr('transform', "translate(#{coord.x}, #{coord.y})")
      @set('container', container)

    initCircle: ->
      [radius, angle] = @_getRadiusAndAngle()
      container = @get('container')
      color = @get('color')

      circle = container.append('circle')
        .attr('r', radius)
        .attr('fill', color)
      @set('circle', circle)

    initArc: ->
      [radius, angle] = @_getRadiusAndAngle()
      container = @get('container')
      color = @get('color')

      d = d3.svg.arc()
        .startAngle(0)
        .innerRadius(radius)
        .outerRadius(radius + 3)
        .endAngle(angle)
      arc = container.append('path')
        .attr('opacity', .5)
        .attr('fill', color)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round')
        .attr('d', d)
      @set('arc', arc)

    initHexagon: ->
      container = @get('container')
      color = @get('color')

      points = ""
      angle = Math.PI / 3
      for i in [0...6]
        currX = Math.cos(i * angle + angle/2) * 18
        currY = Math.sin(i * angle + angle/2) * 18
        points += (i and "," or "") + currX + "," + currY

      hexagon = container.append("svg:polygon")
        .attr('fill', color)
        .attr('stroke', color)
        .attr('stroke-width', 18)
        .attr('opacity', .5)
        .attr('points', points)
        .style('stroke-linejoin', 'round')
      @set('hexagon', hexagon)

      self = @
      hexagon.on('mousedown',  -> self.mouseDown.call(self))
      hexagon.on('mouseup',    -> self.mouseUp.call(self))
      hexagon.on('mouseover',  -> self.mouseOver.call(self))
      hexagon.on('mouseout',   -> self.mouseOut.call(self))
      hexagon.on('touchstart', -> self.touchStart.call(self))
      hexagon.on('touchmove',  -> self.touchMove.call(self))
      hexagon.on('touchend',   -> self.touchEnd.call(self))
      #hexagon.on('touchcancel', -> self.touchCancel.call(self))

    initArrow: ->
      container = @get('container')
      color = @get('color')

      arrow = container.append("svg:polygon")
        .attr('stroke', color)
        .attr('stroke-width', 5)
        .attr("points", "0,0 10,10 0,5 -10,10 0,0")
        .attr('stroke-linejoin', 'round')
        .attr('visibility', 'hidden')
      @set('arrow', arrow)
      if @get('direction')
        @changedDirection()

    initTmpArrow: ->
      return if @constructor.tmp_arrow
      svg = @get('svg')
      arrow = svg.append("svg:polygon")
        .attr('stroke', '#ffff00')
        .attr('stroke-width', 5)
        .attr("points", "0,0 10,10 0,5 -10,10 0,0")
        .attr('stroke-linejoin', 'round')
        .attr('visibility', 'hidden')
      @constructor.tmp_arrow = arrow

    _powerToRadiusAndAngle: (power) ->
      angle = 0
      p = power
      max_radius = 21
      for radius in [3..max_radius] by 3
        perimeter = radius * 2 * Math.PI
        if p > perimeter
          if radius >= max_radius
            break
            #throw new Error("maximum power exceeded for #{power}")
          p -= perimeter
        else
          angle = 2 * Math.PI * p / perimeter
          break
      return [radius, angle]

    _getRadiusAndAngle: ->
      power = @get('power')
      fn = @_powerToRadiusAndAngle
      angle = Cache.call("angle_for_#{power}", fn, @, power)

    changedPower: ->
      [radius, angle] = @_getRadiusAndAngle()
      d = d3.svg.arc()
        .startAngle(0)
        .innerRadius(radius)
        .outerRadius(radius + 3)
        .endAngle(angle)
      @get('arc').attr('d', d)
      @get('circle').attr('r', radius)

    changedColor: ->
      color = @get('color')
      @get('circle')
        .attr('fill', color)
      @get('arc')
        .attr('stroke', color)
        .attr('fill', color)
      @get('hexagon')
        .attr('stroke', color)
        .attr('fill', color)
      @get('arrow')
        .attr('stroke', color)
      container = @get('container')
      t = container.attr('transform')
      container
        .attr('transform', t + ' scale(0.5, 0.5)')
        .transition()
        .attr('transform', t)

    _transformArrow: (arrow, d, offset) ->
      d = parseInt(d)
      direction = d == 1 and 6 or d - 1
      arrow.style('visibility', direction > 0 and 'visible' or 'hidden')
      return unless direction > 0
      t = d3.transform()
      t.rotate = direction * 60 - 30
      coord_x = Math.cos((direction - 2) * Math.PI / 3) * 30
      coord_y = Math.sin((direction - 2) * Math.PI / 3) * 30
      if offset
        t.translate = [coord_x + offset.x, coord_y + offset.y]
      else
        t.translate = [coord_x, coord_y]
      arrow.attr('transform', t.toString())

    changedDirection: ->
      @_transformArrow(@get('arrow'), @get('direction'))

    tmpArrowTo: (d) ->
      return unless @constructor.tmp_arrow
      @_transformArrow(@constructor.tmp_arrow, d, @get('coord'))

    mouseDown: ->
      return if Graphics.touch_detected
      Graphics.rollbackActions()
      @get('parent').dragstart.call(@get('parent'))

    mouseUp: ->
      return if Graphics.touch_detected
      @get('parent').dragstop.call(@get('parent'))
      Graphics.rollbackActions()

    mouseOver: ->
      return if Graphics.touch_detected
      @get('parent').dragover.call(@get('parent'))

    mouseOut: ->
      return if Graphics.touch_detected
      @tmpArrowTo(0)
      @get('parent').dragout.call(@get('parent'))

    touchStart: ->
      return if Graphics.mouse_detected
      @get('parent').dragstart.call(@get('parent'))

    touchMove: ->
      return if Graphics.mouse_detected
      e = d3.event
      point = @_translate2local(e.touches[0].clientX, e.touches[0].clientY)
      @get('parent').dragmove.call(@get('parent'))
      # TODO check within neighbours
      if @is_point_inside(point)
        d3.select('#debug_el').attr('cx', point.x).attr('cy', point.y)

    touchEnd: ->
      return if Graphics.mouse_detected
      @get('parent').dragstop.call(@get('parent'))

    touchCancel: ->
      return if Graphics.mouse_detected
      console.log('touch cancel')
      @get('parent').dragstop.call(@get('parent'))

    _translate2local: (x, y) ->
      # TODO make sure this method reports when browser type error etc.
      # or probably multi browser support
      rect = @get('svg')[0][0].getBoundingClientRect()
      _x = x - rect.left
      _y = y - rect.top
      return {x: _x, y: _y}

    is_point_inside: (point) ->
      # credit to:
      # http://www.playchilla.com/how-to-check-if-a-point-is-inside-a-hexagon
      coord = @get('coord')
      _vert = 27 / 2
      _hori = 27 * Math.sqrt(3) / 2
      q2x = Math.abs(point.x - coord.x)
      q2y = Math.abs(point.y - coord.y)
      return false if q2x > _hori || q2y > _vert*2
      m = 2 * _vert * _hori - _vert * q2x - _hori * q2y
      return m >= 0

    animateHoverIn: ->
      @get('hexagon')
        .transition()
        .attr('stroke-width', 24)
        .ease('easeInOutCirc')

    animateHoverOut: ->
      @get('hexagon')
        .transition()
        .attr('stroke-width', 18)
        .ease('easeInOutCirc')

  })

Cell = Backbone.Model.extend
  defaults:
    neighbours: []
    power: 50
    color: "#cccccc"
    direction: 0

  initialize: ->
    el = new Graphics.Cell
      svg: @get('svg')
      color: @get('color')
      coord: _.clone(@get('coord'))
      power: @get('power')
      direction: @get('direction')
      parent: @
    @set('el', el)
    @on('change:power', @powerChanged, @)
    @on('change:color', @colorChanged, @)
    @on('change:direction', @directionChanged, @)

  dragstart: ->
    return unless @get('enabled')
    for direction, cell of @get('neighbours')
      cell.set('drag_src', [direction, @])
    Graphics.rollback_queue.push([
      ->
        for direction, cell of @get('neighbours')
          cell.set('drag_src', null)
      , @
    ])

  dragmove: ->
    console.debug('dragmove')

  dragover: ->
    console.debug('dragover')
    drag_src_info = @get('drag_src')
    return unless @get('enabled') or drag_src_info
    @get('el').animateHoverIn()
    if drag_src_info
      [direction, drag_src] = drag_src_info
      drag_src.get('el').tmpArrowTo(direction)

  dragout: ->
    console.debug('dragout')
    drag_src_info = @get('drag_src')
    return unless @get('enabled') or drag_src_info
    @get('el').animateHoverOut()

  dragstop: ->
    console.debug('dragstop')
    drag_src_info = @get('drag_src')
    if drag_src_info
      @get('el').animateHoverOut()
      [direction, drag_src] = drag_src_info
      # triggers move action
      src_coord = drag_src.get('coord')
      dest_coord = @get('coord')
      args = [src_coord.x, src_coord.y, dest_coord.x, dest_coord.y]
      @get('renderengine').move.apply(@get('renderengine'), args)

  colorChanged: ->
    @get('el').set('color', @get('color'))

  powerChanged: ->
    @get('el').set('power', @get('power'))

  directionChanged: ->
    @get('el').set('direction', @get('direction'))

class RenderEngine
  board: []
  svg: null
  user_id: null
  colors:
    red: "#F72700"
    blue: "#447786"
    gray: "#C8C8C8"

  constructor: (container_id, width, height, user_id) ->
    @svg = Graphics.createSVG(container_id, width, height)
    @user_id = user_id

  updateBoard: (board_users, board_powers, board_moves) ->
    # board_users  : [[<user_id>, <user_id> ...], ...]
    # board_powers : [[<power>, <power> ...], ...]
    # board_moves  : [[<from_x>, <from_y>, <to_x>, <to_y>], ...]
    # TODO optimize directions
    directions = {}
    for y of board_users
      @board[y] = [] if not (y of @board)
      for x of board_users[y]
        # TODO remove this legacy check
        if typeof(board_users[y][x]) == "object"
          [user_id, _dummy_color] = board_users[y][x]
        else
          user_id = board_users[y][x]

        power = board_powers[y][x]
        color = @_getColor(user_id)

        @board[y][x] = @_newCellAt(x, y, color) if not (x of @board[y])

        @board[y][x].set('color', color)
        @board[y][x].set('power', power)
        @board[y][x].set('enabled', user_id == @user_id)
        d = @board[y][x].get('direction')
        directions["#{y}_#{x}"] = d if d

    # set directions
    for [fx, fy, tx, ty] in board_moves
      direction = @_getDirection(fx, fy, tx, ty)
      if direction
        @board[fy][fx].set('direction', direction)
        delete directions["#{fy}_#{fx}"]
    for pos of directions
      [y, x] = pos.split('_')
      @board[y][x].set('direction', 0)

    # set its neighbours
    has_cell_at = (y, x) ->
      if y of board_users
        return x of board_users[y]
      return false
    for y of board_users
      for x of board_users[y]
        y = parseInt(y)
        x = parseInt(x)
        shift = if y % 2 then 0 else 1
        neighbours = []
        neighbours[1] = @board[y-1][x-1+shift]  if has_cell_at(y-1, x-1+shift)
        neighbours[2] = @board[y-1][x+shift]    if has_cell_at(y-1, x+shift)
        neighbours[3] = @board[y][x+1]          if has_cell_at(y, x+1)
        neighbours[4] = @board[y+1][x+shift]    if has_cell_at(y+1, x+shift)
        neighbours[5] = @board[y+1][x-1+shift]  if has_cell_at(y+1, x-1+shift)
        neighbours[6] = @board[y][x-1]          if has_cell_at(y, x-1)
        @board[y][x].set('neighbours', neighbours)
    return

  _getDirection: (fx, fy, tx, ty) ->
    shift = if fy % 2 then 0 else 1
    return 1 if ty == fy - 1 and tx == fx - 1 + shift
    return 2 if ty == fy - 1 and tx == fx + shift
    return 3 if ty == fy     and tx == fx + 1
    return 4 if ty == fy + 1 and tx == fx + shift
    return 5 if ty == fy + 1 and tx == fx - 1 + shift
    return 6 if ty == fy     and tx == fx - 1
    return 0

  _newCellAt: (x, y, color) ->
    new Cell
      svg: @svg
      color: color
      coord: {x: x, y: y}
      renderengine: @

  _getColor: (user_id) ->
    if not ('_colors_assigned' of @)
      @_colors_assigned = {}
      @_colors_left = [@colors.blue, @colors.red]
    if user_id == 0
      return @colors.gray
    if user_id of @_colors_assigned
      return @_colors_assigned[user_id]
    if @_colors_left.length
      return @_colors_assigned[user_id] = @_colors_left.shift()
    num_users = ((i for i of @_colors_assigned).length + 1)
    throw new Error "not enough colors for #{num_users} users"

  move: (fx, fy, tx, ty) ->
    console.log(fx, fy, tx, ty, @)

window.Engine = RenderEngine
