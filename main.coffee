svg = d3.select('body')
  .append('svg')
    .attr('width', 500)
    .attr('height', 400)

PIXEL_SIZE = 5
HEXAGON = [
  "        ****        ",
  "      **0110**      ",
  "    **00111100**    ",
  "  **000112211000**  ",
  "**0000112222110000**",
  "*000011223322110000*",
  "*000112233332211000*",
  "*001122334433221100*",
  "*011223344443322110*",
  "*112233445544332211*",
  "*112233445544332211*",
  "*011223344443322110*",
  "*001122334433221100*",
  "*000112233332211000*",
  "*000011223322110000*",
  "**0000112222110000**",
  "  **000112211000**  ",
  "    **00111100**    ",
  "      **0110**      ",
  "        ****        ",
]



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

hexagon = (board_el, coord, colors) ->
  width = 20 * PIXEL_SIZE
  height = 16 * PIXEL_SIZE
  [hex_x, hex_y] = coord
  hex_x = parseInt(hex_x)
  hex_y = parseInt(hex_y)
  offset_x = if hex_y % 2 then .5 else 0
  pos_x = width * (hex_x + offset_x)
  pos_y = height * hex_y
  cell = board_el.append('svg:g')
  cell.attr('transform',  'translate(' +  pos_x + ', ' + pos_y + ')')
  for y, row of HEXAGON
    for x, dot of row
      if dot of colors
        Tools.drawPixel(cell, x, y, PIXEL_SIZE, colors[dot])
  return cell

Hexagon = Backbone.Model.extend
  defaults:
    container: null
    coord: null
    color: null
    pixels: []
  initialize: ->
    hexagon(@get('container'), @get('coord'), @get('color'))
    @on("change:color", @colorChanged, @)
  colorChanged: ->
    console.log "color changed to " + @get('color')

Cell = Backbone.Model.extend
  defaults:
    element: null
    power: 0
    user_id: null
    location: null
  hasCell: ->
    return @.get('element') != null

board = [
  [1, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 2],
]

user_colors =
  0:
    '*': '#7a7a7a'
    '0': '#888888'
    '1': '#949494'
    '2': '#a0a0a0'
    '3': '#acacac'
    '4': '#b8b8b8'
    '5': '#c4c4c4'
    '6': '#cfcfcf'
    '7': '#dbdbdb'
    '8': '#e7e7e7'
    '9': '#f3f3f3'
  1:
    '*': '#e60000'
    '0': '#ff6666'
    '1': '#ff8080'
    '2': '#ff9999'
    '3': '#ffb2b2'
    '4': '#ffcccc'
    '5': '#ffe6e6'
  2:
    '*': '#0000e6'
    '0': '#6666ff'
    '1': '#8080ff'
    '2': '#9999ff'
    '3': '#b2b2ff'
    '4': '#ccccff'
    '5': '#e6e6ff'

for y of board
  for x of board[y]
    user_id = board[y][x]
    board[y][x] = new Cell(
      element: new Hexagon
        container: svg
        coord: [x, y]
        color: user_colors[user_id]
      power: 10
      user_id: user_id
      location: [x, y]
    )

a = new Pixel()
console.log a.get()
a.set('color': "#ff0000")
console.log a.get()
