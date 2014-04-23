H = {}
H.increment = [
  [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0,   0,   0,   0,   0, 153, 154,   0,   0,   0,   0,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0,   0,   0,   0, 152, 120, 121, 155,   0,   0,   0,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0,   0,   0, 151, 119,  91,  92, 122, 156,   0,   0,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0,   0, 150, 118,  90,  66,  67,  93, 123, 157,   0,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0, 149, 117,  89,  65,  45,  46,  68,  94, 124, 158,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0, 148, 116,  88,  64,  44,  28,  29,  47,  69,  95, 125, 159,   0,   0,   0,   0],
  [  0,   0,   0, 147, 115,  87,  63,  43,  27,  15,  16,  30,  48,  70,  96, 126, 160,   0,   0,   0],
  [  0,   0, 146, 114,  86,  62,  42,  26,  14,   6,   7,  17,  31,  49,  71,  97, 127, 161,   0,   0],
  [  0, 145, 113,  85,  61,  41,  25,  13,   5,   1,   2,   8,  18,  32,  50,  72,  98, 128, 162,   0],
  [  0, 180, 144, 112,  84,  60,  40,  24,  12,   4,   3,   9,  19,  33,  51,  73,  99, 129, 163,   0],
  [  0,   0, 179, 143, 111,  83,  59,  39,  23,  11,  10,  20,  34,  52,  74, 100, 130, 164,   0,   0],
  [  0,   0,   0, 178, 142, 110,  82,  58,  38,  22,  21,  35,  53,  75, 101, 131, 165,   0,   0,   0],
  [  0,   0,   0,   0, 177, 141, 109,  81,  57,  37,  36,  54,  76, 102, 132, 166,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0, 176, 140, 108,  80,  56,  55,  77, 103, 133, 167,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0,   0, 175, 139, 107,  79,  78, 104, 134, 168,   0,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0,   0,   0, 174, 138, 106, 105, 135, 169,   0,   0,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0,   0,   0,   0, 173, 137, 136, 170,   0,   0,   0,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0,   0,   0,   0,   0, 172, 171,   0,   0,   0,   0,   0,   0,   0,   0,   0],
  [  0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0],
]
H.levels = [180, 180 + 112, 180 + 112 + 60, 180 + 112 + 60 + 24, 180 + 112 + 60 + 24 + 4]

RenderEngine =
  user_colors:
    0:
      '*': '#7a7a7a'
      '0': '#888888'
      '1': '#949494'
      '2': '#a0a0a0'
      '3': '#acacac'
      '4': '#b8b8b8'
      '5': '#c4c4c4'
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

  PIXEL_SIZE: 5

  ###
  5 - 4 = 4
  4 - 4 + 5*4 = 24
  3 - 4 + 5*4 + 9*4 = 60
  2 - 4 + 5*4 + 9*4 + 13*4 = 112
  1 - 4 + 5*4 + 9*4 + 13*4 + 17*4 = 180
  total: 380

  ###

  HEXAGON: ["        ****        ",
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
            "        ****        ",]

  board: null

  Cell: Backbone.Model.extend
    defaults:
      container: null
      element: null
      power: 0
      user_id: null
      coord: null
      colors: null
    initialize: ->
      el_hexagon = new RenderEngine.Hexagon
        container: @get('container')
        coord: @get('coord')
        color: @get('colors')
        power: @get('power')
      @set('element', el_hexagon)
      @on("change:user_id", @userChanged, @)
      @on("change:power", @powerChanged, @)
    userChanged: ->
      @get('element').set('color', @get('colors'))
    powerChanged: ->
      @get('element').set('power', @get('power'))

  Hexagon: Backbone.Model.extend
    defaults:
      container: null
      coord: null
      color: null
      power: null
      pixels: null
    initialize: ->
      colors = @get('color')
      [hex_x, hex_y] = @get('coord')
      cell = @get('container').append('svg:g')
      power = @get('power')

      width = 20 * RenderEngine.PIXEL_SIZE
      height = 16 * RenderEngine.PIXEL_SIZE
      hex_x = parseInt(hex_x)
      hex_y = parseInt(hex_y)
      offset_x = if hex_y % 2 then .5 else 0
      pos_x = width * (hex_x + offset_x)
      pos_y = height * hex_y
      cell.attr('transform',  'translate(' +  pos_x + ', ' + pos_y + ')')
      pixels = []
      for y, row of RenderEngine.HEXAGON
        pixel_row = []
        for x, dot of row
          if dot of colors
            color = colors[dot]
            if dot > 0
              color = colors[0]
              if power <= H.levels[0 + 1]
                if power >= H.increment[y][x]
                  color = colors[1]
            pixel = new RenderEngine.Pixel
              container: cell
              x: x
              y: y
              size: RenderEngine.PIXEL_SIZE
              color: color
            pixel_row.push(pixel)
          else
            pixel_row.push(null)
        pixels.push(pixel_row)
      @set('pixels', pixels)
      @on("change:color", @redraw, @)
      @on("change:power", @redraw, @)
    redraw: ->
      colors = @get('color')
      pixels = @get('pixels')
      power = @get('power')
      for y, row of RenderEngine.HEXAGON
        for x, dot of row
          if dot of colors
            pixels[y][x].set('color', colors[dot])

  Pixel: Backbone.Model.extend
    defaults:
      container: null
      element: null
      x: null
      y: null
      size: null
      color: null
    initialize: ->
      x = parseInt(@get('x'))
      y = parseInt(@get('y'))
      size = @get('size')
      pixel = @get('container').append('line')
        .attr('x1', x * size)
        .attr('y1', (y + 0.5) * size)
        .attr('x2', (x + 1) * size)
        .attr('y2', (y + 0.5) * size)
        .style('stroke-width', size)
        .style('stroke', @get('color'))
      @set('element', pixel)
      @on("change:color", @colorChanged, @)
    colorChanged: ->
      pixel = @get('element')
      pixel.transition().style('stroke', @get('color'))

  init: (board) ->
    svg = d3.select('body').append('svg')
        .attr('width', 500)
        .attr('height', 400)

    RenderEngine.board = []
    for y of board
      row = []
      for x of board[y]
        [user_id, power] = board[y][x]
        cell = new RenderEngine.Cell
          power: power
          user_id: user_id
          coord: [x, y]
          container: svg
          colors: RenderEngine.user_colors[user_id]
        row.push(cell)
      RenderEngine.board.push(row)

  updateBoard: (board) ->
    for y of board
      for x of board[y]
        [user_id, power] = board[y][x]
        cell = RenderEngine.board[y][x]
        if cell.get('user_id') != user_id
          cell.set('colors', RenderEngine.user_colors[user_id])
          cell.set('power', power)
          cell.set('user_id', user_id)
        else if cell.get('power') != power
          cell.set('power', power)


###
# board - Two dimentional array. Each item should be formatted as
#         [<user_id>,<power>]
###
board = [
  [[1, 50], [0, 10], [0, 10], [0, 10]],
  [[0, 10], [0, 10], [0, 10], [0, 10]],
  [[0, 10], [0, 10], [0, 10], [0, 10]],
  [[0, 10], [0, 10], [0, 10], [2, 50]],
]

RenderEngine.init(board)

step = 0
setInterval('tick()', 2000)
window.tick = ->
  step++
  if step == 1
    board[0][1] = [1, 27]
    board[2][3] = [2, 30]
  if step == 2
    board[0][2] = [1, 10]
  board[0][1][1]++
  return
  if step > 2
    board[0][1] = [0, 10]
    board[2][3] = [0, 10]
    board[0][2] = [0, 10]
    step = 0

  RenderEngine.updateBoard(board)

window.RE = RenderEngine  # TODO remove. debug only
