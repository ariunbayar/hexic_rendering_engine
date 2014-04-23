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

  @drawCircle = (x, y, r, border, colors)->
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
  @drawHexagon = (x, y, r, border, colors)->
    @svg.append("svg:polygon")
      .attr('fill', '#fff')
      .attr('fill', colors.fill)
      .attr('stroke', colors.stroke)
      .attr('stroke-width', border)
      .attr("points", CalculateStarPoints(x, y, 6, r, Math.sin(Math.PI/3) * r))

  return

H =  # helpers
  rand: (n) ->
    Math.round(Math.random() * n)
  colors: (r, g, b) ->
    stroke: "rgba(#{r}, #{g}, #{b}, 1)"
    fill: "rgba(#{r}, #{g}, #{b}, .3)"

C =  # constants
  radius:   29
  border:   0
  offset_x: 2 * 30 * Math.sin(Math.PI / 3)
  offset_y: 2 * 30 * Math.sin(Math.PI / 3) * Math.sin(Math.PI / 3)
  colors:
    red: H.colors(255, 0, 0)
    blue: H.colors(0, 0, 255)

Cell = ->
  @init = (x, y, colors, power) ->
    return if @el != undefined
    @coord = @getCoords(x, y)
    #@el_bg = g.drawCircle(@coord.x, @coord.y, C.radius, C.border, colors)
    @el_bg = g.drawHexagon(@coord.x, @coord.y, C.radius, C.border, colors)
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
    coord_x = x * C.offset_x
    if y % 2
      coord_x += C.offset_x / 2
    coord_y = y * C.offset_y
    return {x: coord_x, y: coord_y }

  return


CalculateStarPoints = (centerX, centerY, arms, outerRadius, innerRadius) ->
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

g = new G
g.initSvg()

for y in [1..6]
  for x in [1..6]
    colors = [C.colors.red, C.colors.blue][H.rand(1)]
    (new Cell).init(x, y, colors, H.rand(500))

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
