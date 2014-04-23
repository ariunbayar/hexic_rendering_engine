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
  [[1, 50], [0, 90], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], ],
  [[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [2, 50], ],
]

window.game = new Engine

step = 0
timer = setInterval('ticker()', 3000)
game.updateBoard(board)
window.ticker = ->
  step++
  board[0][0] = [1, 20 * step]
  board[0][1] = [1, 75] if step == 1
  if step == 2
    board[0][2] = [1, 30]
    board[4][4] = [2, 30]
  board[0][3] = [1, 20] if step == 3
  board[4][3] = [2, 25] if step == 4
  if step == 5
    board[1][2] = [1, 15]
    board[4][2] = [2, 10]
    clearInterval(timer)

  game.updateBoard(board)
