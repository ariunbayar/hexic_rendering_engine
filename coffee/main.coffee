###
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

  return
###


board = [
  [[1, 50], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [2, 50], ],
]

window.game = new Engine
game.updateBoard(board)
