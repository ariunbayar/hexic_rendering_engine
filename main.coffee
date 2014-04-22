svg = d3.select('body')
  .append('svg')
    .attr('width', 500)
    .attr('height', 400)

PIXEL_SIZE = 5

# Pixel model
Pixel = Backbone.Model.extend(
  defaults:
    element: null
    x: 0
    y: 0
    size: 3
    color: "#000000"
  set: (color) ->
    return @color = color
  get: ->
    return @
  )

Tools =
  drawPixel: (container, x, y, size, color) ->
    x = parseInt(x)
    y = parseInt(y)
    style = 'stroke-width:' + size + '; stroke:' + color + ';'
    pixel = container.append('line')
      .attr('x1', x * size)
      .attr('y1', (y + 0.5) * size)
      .attr('x2', (x + 1) * size)
      .attr('y2', (y + 0.5) * size)
      .attr('style', style)
    return pixel

hexagon = (board_el, coord) ->
  stroke = '#ff0000'
  fill = '#ff9999'
  map = [
    "        ****        ",
    "      **0000**      ",
    "    **00000000**    ",
    "  **000000000000**  ",
    "**0000000000000000**",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "*000000000000000000*",
    "**0000000000000000**",
    "  **000000000000**  ",
    "    **00000000**    ",
    "      **0000**      ",
    "        ****        ",
  ]
  width = 20 * PIXEL_SIZE
  height = 16 * PIXEL_SIZE
  [hex_x, hex_y] = coord
  hex_x = parseInt(hex_x)
  hex_y = parseInt(hex_y)
  offset_x = if hex_y % 2 then .5 else 0
  pos_x = width * (hex_x + offset_x)
  pos_y = height * hex_y
  cell = board_el.append('svg:g').attr('transform',  'translate(' +  pos_x + ', ' + pos_y + ')')
  for y, row of map
    for x, dot of row
      if dot != " "
        color = if dot == "0" then fill else stroke
        Tools.drawPixel(cell, x, y, PIXEL_SIZE, color)
  return cell

Cell = Backbone.Model.extend(
  defaults:
    element: null
    power: 0
    user_id: null
    location: null
  hasCell: ->
    return @.get('element') != null
  )

board = [
  [1, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 2],
]

for y of board
  for x of board[y]
    board[y][x] = new Cell(
      element: hexagon(svg, [x, y])
      power: 10
      user_id: board[y][x]
      location: [x, y]
    )

a = new Pixel()
console.log a.get()
a.set('color': "#ff0000")
console.log a.get()
