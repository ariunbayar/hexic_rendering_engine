G = ->  # graphics class
  @svg = null
  @progress = 0
  @initSvg = ->
    @svg = d3.select('body').append('svg')
      .attr('width', 500)
      .attr('height', 400)

  @drawArc = (x, y, inner_radius, outer_radius, fill_percent, color) ->
    @arc_calc = d3.svg.arc()
      .startAngle(0)
      .innerRadius(inner_radius)
      .outerRadius(outer_radius)
    g = @svg.append('g')
      .attr('transform', "translate(#{x}, #{y})")
    arc = g.append('path')
      .attr('fill', color)
      .attr('d', @arc_calc.endAngle(2 * Math.PI * fill_percent))
    return arc

  @animateArc = () ->
    @arc.attr('d', @arc_calc.endAngle(2 * Math.PI * (@progress / 100)))

  @drawCircle = (x, y, r, border, colors) ->
    circle = @svg.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', r)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .attr('fill', colors.fill)
    return circle

  @animateCircle = ->
    @circle.transition()
      .duration(700)
      .attr('cx', 200)

  @drawHexagon = (x, y, r, border, colors) ->
    @svg.append("svg:polygon")
      .attr('fill', '#fff')
      .attr('fill', colors.fill)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .attr("points", Helpers.polygon.getPoints(x, y, 6, r))

  return

Cell = ->
  @init = (x, y, colors, power) ->
    return if @el != undefined
    @coord = @getCoords(x, y)
    #@el_bg = g.drawCircle(@coord.x, @coord.y, Settings.radius, Settings.border, colors)
    @el_bg = g.drawHexagon(@coord.x, @coord.y, Settings.radius, Settings.border, colors)
    @colors = colors
    @drawPower(power)

  @drawPower = (power) ->
    radiuses = [3, 6, 9, 12, 15, 18, 21, 24, 27]
    level = 0
    while (true)
      radius = radiuses[level]
      perimeter = 2 * Math.PI * radius
      if power < perimeter
        break
      power -= perimeter
      level++
    if radius - 3
      g.drawCircle(@coord.x, @coord.y, radius - 3, 0, {stroke: @colors.stroke, fill: @colors.stroke})
    g.drawArc(@coord.x, @coord.y, 0, radius, power / perimeter, @colors.fill)
    return

  @getCoords = (x, y) ->
    coord_x = x * Settings.offset_x
    if y % 2
      coord_x += Settings.offset_x / 2
    coord_y = y * Settings.offset_y
    return {x: coord_x, y: coord_y }

  return


g = new G
g.initSvg()

for y in [1..6]
  for x in [1..6]
    colors = [Settings.colors.red, Settings.colors.blue][Helpers.rand(1)]
    (new Cell).init(x, y, colors, Helpers.rand(500))

###
engine.animateCircle()
engine.drawArc(100, 100, 0, 10)
setInterval(->
  engine.progress += 10
  if engine.progress > 100
    engine.progress = 100
  engine.animateArc()
, 200)
###
