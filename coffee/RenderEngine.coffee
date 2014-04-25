if typeof(d3) == "undefined"
  console.log "d3.js is not included. Consult with d3js.org"
  return

Graphics =
  createSVG: (container_selector, width, height) ->
    d3.select(container_selector).append('svg')
      .attr('width', width)
      .attr('height', height)

  drawContainer: (svg, x, y) ->
    svg.append('g')
      .attr('transform', "translate(#{x}, #{y})")

  drawArc: (container, inner_radius, outer_radius, fill_percent, color) ->
    container.append('path')
      .attr('fill', color)
      .attr('d', Helpers.arc.getD(0, 2 * Math.PI * fill_percent, inner_radius, outer_radius))

  drawCircle: (container, r, border, colors) ->
    container.append('circle')
      .attr('r', r)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .attr('fill', colors.fill)

  drawHexagon: (container, r, border, colors) ->
    container.append("svg:polygon")
      .attr('fill', colors.fill)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .style('stroke-linejoin', 'round')
      .attr("points", Helpers.polygon.getPoints(0, 0, 6, r))

  drawArrow: (container, colors) ->
    g = container.append('g')
    g.append("svg:polyline")
      .attr('stroke-width', 1)
      .attr("points", "0,0 10,10 0,5 -10,10 0,0")
      .attr('transform', "translate(0, -32)")
      .style('visibility', 'hidden')
    return g

  changeHexagonColor: (el, colors) ->
    el_parent = d3.select(el[0][0].parentNode)
    el_parent.transition()
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .each('end', ->
        el.attr('fill', colors.fill)
          .attr('stroke', colors.stroke)
      )
      .transition()
      .attr('fill-opacity', 1)
      .attr('stroke-opacity', 1)

  changeArcColor: (el, color) ->
    el.attr('fill', color)

  changeCircleColor: (el, colors) ->
    el.attr('stroke', colors.stroke)
      .attr('fill', colors.fill)

  changeCircleRadius: (el, radius) ->
    el.transition()
      .duration(750)
      .attr('r', radius)
      .ease('elastic')

  changeArcRadius: (el, inner_radius, outer_radius, progress) ->
    el.attr('d', Helpers.arc.getD(0, 2 * Math.PI * progress, inner_radius, outer_radius))

  changeArrowDirection: (el, direction, colors) ->
    el.attr('transform', Helpers.arrow.getAngleBy(direction))
    el.select('polyline')
      .attr('fill', colors.fill)
      .attr('stroke', colors.stroke)
      .style('stroke-linecap', 'round')
      .style('stroke-linejoin', 'round')
      .style('visibility', 'visible')

  dragStarted: ->
    console.log "Drag started"

  mouseoverHexagon: (el) ->
    el.transition()
      .style('stroke-width', 3)
      .style('fill-opacity', .5)

  mouseoutHexagon: (el) ->
    el.transition()
      .style('stroke-width', 0)
      .style('fill-opacity', 1)

  mousedownHexagon: (el) ->
    drag: d3.behavior.drag ->
      @on('dragstart', dragStarted)
      #.on('drag', dragged)
      #.on('dragend', dragended)

Helpers =
  arc:
    getD: (start_angle, end_angle, inner_radius, outer_radius) ->
      d3.svg.arc()
        .startAngle(start_angle)
        .innerRadius(inner_radius)
        .outerRadius(outer_radius)
        .endAngle(end_angle)

  polygon:
    getStarPoints: (centerX, centerY, arms, outerRadius, innerRadius) ->
      results = ""
      angle = Math.PI / arms

      for i in [0...(2 * arms)]
        # Use outer or inner radius depending on what iteration we are in.
        r = if (i & 1) == 0 then outerRadius else innerRadius

        currX = centerX + Math.cos(i * angle + angle) * r
        currY = centerY + Math.sin(i * angle + angle) * r

        # Our first time we simply append the coordinates, subsequet times
        # we append a ", " to distinguish each coordinate pair.
        if i == 0
          results = currX + "," + currY
        else
          results += ", " + currX + "," + currY

      return results

    getPoints: (centerX, centerY, arms, radius) ->
      results = ""
      angle = Math.PI * 2 / arms

      for i in [0...arms]
        currX = centerX + Math.cos(i * angle + angle/2) * radius
        currY = centerY + Math.sin(i * angle + angle/2) * radius

        # Our first time we simply append the coordinates, subsequet times
        # we append a ", " to distinguish each coordinate pair.
        if i == 0
            results = currX + "," + currY
        else
            results += ", " + currX + "," + currY

      return results

  arrow:
    getAngleBy: (direction) ->
      if direction == 1
        degrees = " rotate(330)"
      if direction == 2
        degrees = " rotate(35)"
      if direction == 3
        degrees = " rotate(90)"
      if direction == 4
        degrees = " rotate(150)"
      if direction == 5
        degrees = " rotate(210)"
      if direction == 6
        degrees = " rotate(270)"
      return degrees

  colors: (r, g, b) ->
    stroke: "rgba(#{r}, #{g}, #{b}, 1)"
    fill: "rgba(#{r}, #{g}, #{b}, .3)"

  coords: (position) ->
    coord_x = position.x * Settings.offset_x + Settings.board_offset_x
    if position.y % 2
      coord_x += Settings.offset_x / 2
    coord_y = position.y * Settings.offset_y + Settings.board_offset_y
    return {x: coord_x, y: coord_y }

  getRadiusAndProgressFor: (power) ->
    level = 0
    radius_diff = Settings.radiuses[1] - Settings.radiuses[0]
    while (true)
      if not (level of Settings.radiuses)
        power = 0
        break
      r = Settings.radiuses[level]
      perimeter = 2 * Math.PI * r
      if power < perimeter
        break
      power -= perimeter
      level++
    r_arc = r
    r_circle = if r - radius_diff > 0 then r - radius_diff else null
    progress = power / perimeter
    return [r_circle, r_arc, progress]

Settings =
  radius:   29
  radiuses: [3, 6, 9, 12, 15, 18, 21, 24, 27]
  border:   0
  offset_x: 2 * 30 * Math.sin(Math.PI / 3)
  offset_y: 2 * 30 * Math.sin(Math.PI / 3) * Math.sin(Math.PI / 3)
  board_offset_x: 30
  board_offset_y: 30
  colors:
    red: Helpers.colors(255, 0, 0)
    blue: Helpers.colors(0, 0, 255)
    gray: Helpers.colors(127, 127, 127)
    inactive: Helpers.colors(220, 220, 220)

Cell = Backbone.Model.extend
  defaults:
    el_svg: null
    el_container: null
    el_hexagon: null
    el_circle: null
    el_arc: null
    el_arrow: null
    position: null
    colors: Settings.colors.inactive
    power: null
    direction: null
    neighbours: []

  initialize: ->
    coords = Helpers.coords(@get('position'))
    radius = Settings.radius
    border = Settings.border
    colors = @get('colors')
    el_svg = @get('el_svg')

    el_container = Graphics.drawContainer(el_svg, coords.x, coords.y)
    el_hexagon = Graphics.drawHexagon(el_container, radius, border, colors)
    el_arrow = Graphics.drawArrow(el_container, colors)

    # set the initialized elements
    @set('el_container', el_container)
    @set('el_arrow', el_arrow)
    @set('el_hexagon', el_hexagon)

    # bind events
    @on('change:power', @powerChanged, @)
    @on('change:colors', @colorsChanged, @)
    @on('change:direction', @directionChanged, @)
    #el_container.on('mousedown', -> Graphics.mousedownHexagon(el_hexagon))
    # TODO uncomment following 2 lines
    #el_container.on('mouseover', -> Graphics.mouseoverHexagon(el_hexagon))
    #el_container.on('mouseout',  -> Graphics.mouseoutHexagon(el_hexagon))
    # TODO Debug only. remove followings when you uncomment above
    self = @
    el_container.on('mouseover', ->
      Graphics.mouseoverHexagon(el_hexagon)
      for cell in self.get('neighbours')
        Graphics.mouseoverHexagon(cell.get('el_hexagon'))
    )
    el_container.on('mouseout',  ->
      Graphics.mouseoutHexagon(el_hexagon)
      for cell in self.get('neighbours')
        Graphics.mouseoutHexagon(cell.get('el_hexagon'))
    )

  colorsChanged: ->
    colors = @get('colors')
    el_hexagon = @get('el_hexagon')
    el_circle = @get('el_circle')
    el_arc = @get('el_arc')
    if el_hexagon
      Graphics.changeHexagonColor(el_hexagon, colors)
    if el_circle
      c = {stroke: colors.fill, fill: colors.stroke }
      Graphics.changeCircleColor(el_circle, c)
    if el_arc
      Graphics.changeArcColor(el_arc, colors.fill)

  powerChanged: ->
    power = @get('power')
    return if power == null
    coords = Helpers.coords(@get('position'))
    el_container = @get('el_container')
    colors = @get('colors')
    border = Settings.border
    [r_circle, r_arc, progress] = Helpers.getRadiusAndProgressFor(power)

    # resize arc depending on radius and percent calculated from power
    el_arc = @get('el_arc')
    if el_arc == null
      el_arc = Graphics.drawArc(el_container, 0, r_arc, progress, colors.fill)
      @set('el_arc', el_arc)
    else
      Graphics.changeArcRadius(el_arc, 0, r_arc, progress)

    # resize circle depending on radius calculated from power
    return if r_circle == null
    el_circle = @get('el_circle')
    if el_circle == null
      c = {stroke: colors.fill, fill: colors.stroke }
      el_circle = Graphics.drawCircle(el_container, r_circle, border, c)
      @set('el_circle', el_circle)
    else
      Graphics.changeCircleRadius(el_circle, r_circle)

  directionChanged: ->
    colors = @get('colors')
    direction = @get('direction')
    el_arrow = @get('el_arrow')
    if direction
      Graphics.changeArrowDirection(el_arrow, direction, colors)


Engine = ->
  @board = []
  @svg = null

  @updateBoard = (board) ->
    @svg = Graphics.createSVG('body', 500, 400) if @svg == null

    # each cell has to be [<user_id>, <power>, <arrow_direction>]
    for y of board
      @board[y] = [] if not (y of @board)
      for x of board[y]
        [user_id, power, direction] = board[y][x]
        @board[y][x] = @_newCellAt(x, y) if not (x of @board[y])
        @board[y][x].set('colors', @_getColor(user_id))
        @board[y][x].set('power', power)
        @board[y][x].set('direction', direction)

    # set its neighbours
    has_cell_at = (y, x) ->
      if y of board
        return x of board[y]
      return false
    for y of board
      for x of board[y]
        y = parseInt(y)
        x = parseInt(x)
        shift = if y % 2 then 1 else 0
        neighbours = []
        neighbours.push(@board[y-1][x-1+shift]) if has_cell_at(y-1, x-1+shift)
        neighbours.push(@board[y-1][x+shift]) if has_cell_at(y-1, x+shift)
        neighbours.push(@board[y][x+1]) if has_cell_at(y, x+1)
        neighbours.push(@board[y+1][x-1+shift]) if has_cell_at(y+1, x-1+shift)
        neighbours.push(@board[y+1][x+shift]) if has_cell_at(y+1, x+shift)
        neighbours.push(@board[y][x-1]) if has_cell_at(y, x-1)
        @board[y][x].set('neighbours', neighbours)
    return

  @_newCellAt = (x, y) ->
    new Cell
      el_svg: @svg
      position: {x: x, y: y}

  @_getColor = (user_id) ->
    if not ('_colors_assigned' of @)
      @_colors_assigned = {}
      @_colors_left = [Settings.colors.blue, Settings.colors.red]
    if user_id == 0
      return Settings.colors.gray
    if user_id of @_colors_assigned
      return @_colors_assigned[user_id]
    if @_colors_left.length
      return @_colors_assigned[user_id] = @_colors_left.shift()
    num_users = ((i for i of @_colors_assigned).length + 1)
    throw "not enough colors for #{num_users} users"

  return


window.Graphics = Graphics
window.Helpers = Helpers
window.Settings = Settings
window.Engine = Engine
