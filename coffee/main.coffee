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


svg = Graphics.createSVG('body', 400, 500)

for y in [1..6]
  for x in [1..6]
    colors = [Settings.colors.red, Settings.colors.blue][Helpers.rand(1)]
    (new Cell).init(x, y, colors, Helpers.rand(500))
