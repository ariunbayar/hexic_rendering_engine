boardData = _initBoard(6, 2)
game_engine = new GameEngine({}, {containerId:'#svg1', boardData: boardData})
window.game_engine = game_engine  # XXX debug only

return



size = 6
board_users  = (0  for x in [1..size] for i in [1..size])
board_powers = (10 for x in [1..size] for i in [1..size])
board_moves = []

set_player_location = (x, y, id, power)->
  board_users[y][x] = id
  board_powers[y][x] = power
set_player_location(0, 0, 1, 50)
set_player_location(size-1, size-1, 2, 50)

window.board_moves = board_moves

window.game = new Engine('#svg', size*80, size*50, 2)
game.updateBoard(board_users, board_powers, board_moves)

interval = 50
#[incr_at, incr_by, cur_iter] = [40, 1, 0]
[incr_at, incr_by, cur_iter] = [20, 1, 0]

window.ticker = ->
  if (cur_iter = ++cur_iter % incr_at) == 0
    increment_cells(board_powers, board_users)
  if Math.random() > .98
    run_ai(1, board_users, board_powers, board_moves)
  #if Math.random() > .98
    #run_ai(2, board_users, board_powers, board_moves)
  process_attacks(board_users, board_powers, board_moves)
  game.updateBoard(board_users, board_powers, board_moves)

window.pause = ->
  clearInterval(timer)
window.resume = -> window.timer = setInterval('ticker()', interval)
#window.resume()

increment_cells = (powers, users) ->
  for y of powers
    for x of powers[y]
      continue if users[y][x] == 0
      powers[y][x] += incr_by

process_attacks = (users, powers, moves) ->
  move_size = (n)-> ~~(n/10) + 1
  throttle = 1
  for [fx, fy, tx, ty], i in moves
    fuser  = users[fy][fx]
    fpower = powers[fy][fx]
    tuser  = users[ty][tx]
    tpower = powers[ty][tx]
    continue unless fpower > throttle
    n = move_size(fpower - throttle)
    if fuser != tuser
      if tpower < n and fpower > tpower
        fpower = fpower - n
        tpower = n - tpower
        tuser = fuser
      else
        fpower -= n
        tpower -= n
    else
      fpower -= n
      tpower += n
    users[fy][fx] = fuser
    powers[fy][fx] = fpower
    users[ty][tx] = tuser
    powers[ty][tx] = tpower

game.move = (fx, fy, tx, ty)->
  for [_fx, _fy, _tx, _ty], i in board_moves
    if fx == _fx and fy == _fy
      board_moves[i] = [fx, fy, tx, ty]
      return
  board_moves.push([fx, fy, tx, ty])


run_ai = (user_id, users, powers, moves) ->
  has_cell_at = (x, y) ->
    if y of users
      return x of users[y]
    return false
  get_attackable = (x, y) ->
    shift = if y % 2 then 0 else 1
    attackable = false
    mark_if_attackable = (_y, _x) ->  # !!! reversed x, y
      return if attackable
      if has_cell_at(_x, _y)
        if users[_y][_x] != user_id or powers[_y][_x] < powers[y][x]
          attackable = [_x, _y]
    adjacents = [
      [y-1, x-1+shift]
      [y-1, x+shift]
      [y  , x+1]
      [y+1, x+shift]
      [y+1, x-1+shift]
      [y  , x-1]
    ]
    for [_y, _x] in adjacents
      mark_if_attackable(_y, _x)
    #mark_if_attackable.apply(null, adjacents[~~(Math.random() * 5)])
    return attackable

  append_move = (fx, fy, tx, ty) ->
    for [_fx, _fy, _tx, _ty], i in moves
      if fx == _fx and fy == _fy
        moves[i] = [fx, fy, tx, ty]
        return
    moves.push([fx, fy, tx, ty])

  for y of users
    for x of users[y]
      continue if Math.random() < window.limit
      continue if users[y][x] != user_id
      y = parseInt(y)
      x = parseInt(x)
      able = get_attackable(x, y)
      continue unless able
      [_x, _y] = able
      append_move(x, y, _x, _y)
