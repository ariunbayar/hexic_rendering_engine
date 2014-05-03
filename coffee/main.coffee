board_users = [
  [1, 0, 0, 0, 0, 0]
  [0, 0, 0, 0, 0, 0]
  [0, 0, 0, 0, 0, 0]
  [0, 0, 0, 0, 0, 0]
  [0, 0, 0, 0, 0, 0]
  [0, 0, 0, 0, 0, 2]
]
board_powers = [
  [50, 10, 10, 10, 10, 10]
  [10, 10, 10, 10, 10, 10]
  [10, 10, 10, 10, 10, 10]
  [10, 10, 10, 10, 10, 10]
  [10, 10, 10, 10, 10, 10]
  [10, 10, 10, 10, 10, 50]
]
board_moves = [
  [5, 5, 4, 4]
]
window.board_moves = board_moves
window.game = new Engine('#svg', 350, 300)
game.updateBoard(board_users, board_powers, board_moves)
interval = 2000
timer = setInterval('ticker()', interval)
window.ticker = ->
  increment_cells(board_powers)
  run_ai(1, board_users, board_powers, board_moves)
  run_ai(2, board_users, board_powers, board_moves)
  process_attacks(board_users, board_powers, board_moves)
  game.updateBoard(board_users, board_powers, board_moves)
window.pause = ->
  clearInterval(timer)
window.resume = ->
  timer = setInterval('ticker()', interval)

increment_cells = (powers) ->
  for y of powers
    for x of powers[y]
      powers[y][x] += 1

process_attacks = (users, powers, moves) ->
  n = 10
  for [fx, fy, tx, ty], i in moves
    fuser  = users[fy][fx]
    fpower = powers[fy][fx]
    tuser  = users[ty][tx]
    tpower = powers[ty][tx]
    continue unless fpower > n
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

run_ai = (user_id, users, powers, moves) ->
  has_cell_at = (x, y) ->
    if y of users
      return x of users[y]
    return false
  get_attackable = (x, y) ->
    shift = if y % 2 then 0 else 1
    attackable = false
    mark_if_attackable = (_y, _x) ->  # !!! reversed x, y
      if has_cell_at(_x, _y)
        if users[_y][_x] != user_id
          attackable = [_x, _y]
    mark_if_attackable(y-1, x-1+shift)
    mark_if_attackable(y-1, x+shift)
    mark_if_attackable(y  , x+1)
    mark_if_attackable(y+1, x+shift)
    mark_if_attackable(y+1, x-1+shift)
    mark_if_attackable(y  , x-1)
    return attackable
  append_move = (fx, fy, tx, ty) ->
    for [_fx, _fy, _tx, _ty], i in moves
      if fx == _fx and fy == _fy
        moves[i] = [fx, fy, tx, ty]
        return
    moves.push([fx, fy, tx, ty])

  for y of users
    for x of users[y]
      continue if users[y][x] != user_id
      y = parseInt(y)
      x = parseInt(x)
      able = get_attackable(x, y)
      continue unless able
      [_x, _y] = able
      append_move(x, y, _x, _y)
