if typeof(d3) == "undefined"
  console.log "d3.js is not included. Consult with d3js.org"
  return

Graphics =
  createSVG: (container_selector, width, height) ->
    d3.select(container_selector).append('svg')
      .attr('width', width)
      .attr('height', height)

  drawArc: (container, x, y, inner_radius, outer_radius, fill_percent, color) ->
    g = container.append('g')
      .attr('transform', "translate(#{x}, #{y})")
    g.append('path')
      .attr('fill', color)
      .attr('d', Helpers.arc.getD(0, 2 * Math.PI * fill_percent, inner_radius, outer_radius))

  drawCircle: (container, x, y, r, border, colors) ->
    container.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', r)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .attr('fill', colors.fill)

  drawHexagon: (container, x, y, r, border, colors) ->
    g = container.append('g')
      .attr('transform', "translate(#{x} #{y})")
    g.append("svg:polygon")
      .attr('fill', colors.fill)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .attr("points", Helpers.polygon.getPoints(0, 0, 6, r))
    return g

  changeHexagonColor: (el, colors) ->
    el.select('polygon')
      .attr('fill', colors.fill)
      .attr('stroke', colors.stroke)
    old_transform = el.attr('transform')
    el.transition()
      .duration(750)
      .attr('transform', old_transform + ' rotate(180)')
      .each('end', -> d3.select(@).attr('transform', old_transform))

  changeArcColor: (el, color) ->
    el.select('path')
      .attr('fill', color)

  changeCircleColor: (el, colors) ->
    el.select('circle')
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .attr('fill', colors.fill)

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
    el_container: null
    el_hexagon: null
    el_circle: null
    el_arc: null
    position: null
    colors: Settings.colors.inactive
    power: null

  initialize: ->
    coords = Helpers.coords(@get('position'))
    radius = Settings.radius
    border = Settings.border
    colors = @get('colors')
    container = @get('el_container')
    el_hexagon = Graphics.drawHexagon(
      container, coords.x, coords.y, radius, border, colors)
    @set('el_hexagon', el_hexagon)

    @on('change:power', @powerChanged, @)
    @on('change:colors', @colorsChanged, @)

  colorsChanged: ->
    colors = @get('colors')
    el_hexagon = @get('el_hexagon')
    el_circle = @get('el_circle')
    el_arc = @get('el_arc')
    return if el_hexagon == null
    Graphics.changeHexagonColor(el_hexagon, colors)
    if el_circle
      Graphics.changeCircleColor(el_circle, colors)
    #Graphics.changeArcColor(el_arc, colors.fill)

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
      el_arc = Graphics.drawArc(
        el_container, coords.x, coords.y, 0, r_arc, progress, colors.fill)
      @set('el_arc', el_arc)
    else
      Graphics.changeArcRadius(el_arc, r_arc)

    # resize circle depending on radius calculated from power
    return if r_circle == null
    el_circle = @get('el_circle')
    if el_circle == null
      c = {stroke: colors.fill, fill: colors.stroke }
      el_circle = Graphics.drawCircle(
        el_container, coords.x, coords.y, r_circle, border, c)
      @set('el_circle', el_circle)
    else
      Graphics.changeCircleRadius(el_circle, r_circle)

Engine = ->
  @board = []
  @svg = null

  @updateBoard = (board) ->
    @svg = Graphics.createSVG('body', 500, 400) if @svg == null

    # each cell has to be [<user_id>, <power>]
    for y of board
      @board[y] = [] if not (y of @board)
      for x of board
        [user_id, power] = board[y][x]
        @board[y][x] = @_newCellAt(x, y) if not (x of @board[y])
        @board[y][x].set('colors', @_getColor(user_id))
        @board[y][x].set('power', power)
    return

  @_newCellAt = (x, y) ->
    new Cell
      el_container: @svg
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
