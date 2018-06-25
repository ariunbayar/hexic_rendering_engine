import math
import json
import redis
import time

from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt


def generate_board(size):

    board = []

    for y in range(size):
        row = []
        for x in range(size):
            item = {
                'type' : 'cell',
                'count': 50,
                'user' : 0,
            }
            row.append(item)
        board.append(row)

    board[0][0]['count'] = 250;
    board[0][0]['user'] = 1;
    board[-1][-1]['count'] = 250;
    board[-1][-1]['user'] = 2;

    return board


def start(request):

    user_id = request.GET.get('user_id')

    r = redis.StrictRedis(host='localhost', port=6379, db=0)

    ctx = {}

    if 'cleanup' in request.GET:
        r.delete('time_started')
        r.delete('move1')
        r.delete('move2')

    else:

        now = time.time()
        scheduled_time = float(r.get('time_started') or 0.0)
        is_expired = scheduled_time < now

        if is_expired:
            scheduled_time = now + 2
            r.set('time_started', scheduled_time)

        time.sleep(scheduled_time - now)

        ctx['user_id'] = int(user_id);
        ctx['board'] = generate_board(6)
        ctx['width'] = 6
        ctx['height'] = 6
        ctx['colors'] = {
            '0': '#C8C8C8',
            '1': '#447786',
            '2': '#F72700',
            'background': '#FDF6E3',
        }

    rsp = HttpResponse(json.dumps(ctx), content_type="text/plain")
    rsp['Access-Control-Allow-Origin'] = '*'

    return rsp


def get_pending_move(request):

    rval = 'noop'

    r = redis.StrictRedis(host='localhost', port=6379, db=0)
    user_id = request.GET.get('user_id')

    step = 0.2  # seconds

    key = 'move' + user_id

    time.sleep(step)
    for i in range(25):
        move = r.get(key)
        if move:
            r.delete(key)
            rval = move
            break
        time.sleep(step)

    rsp = HttpResponse(rval, content_type="text/plain")
    rsp['Access-Control-Allow-Origin'] = '*'

    return rsp


@csrf_exempt
def move(request):

    r = redis.StrictRedis(host='localhost', port=6379, db=0)
    user_id = request.GET.get('user_id')

    tps = 60;

    def get_expected_tick():
        time_started = float(r.get('time_started'))
        now = time.time()
        run_duration = now - time_started;
        tick_id_expected = math.floor(run_duration * tps)
        return tick_id_expected

    def is_valid_tick(tick_id, tick_id_expected):
        tick_diff = tick_id_expected - tick_id
        return tick_diff < tps

    def is_valid_move(fy, fx, ty, tx):
        # TODO check ownership of originating cell
        shift = 0 if fy % 2 else 1
        return (fy - 1 == ty and fx - 1 + shift == tx or
               fy - 1 == ty and fx     + shift == tx or
               fy     == ty and fx + 1         == tx or
               fy + 1 == ty and fx     + shift == tx or
               fy + 1 == ty and fx - 1 + shift == tx or
               fy     == ty and fx - 1         == tx)

    fy, fx, ty, tx, tick_id = json.loads(request.body)
    tick_id_expected = get_expected_tick()

    if is_valid_tick(tick_id, tick_id_expected):
        if is_valid_move(fy, fx, ty, tx):
            rsp = json.dumps([fy, fx, ty, tx, tick_id_expected])
            r.set('move1', rsp)
            r.set('move2', rsp)
        else:
            import pprint; pprint.pprint('invalid move')
    else:
        import pprint; pprint.pprint('invalid tick')

    rsp = HttpResponse('', content_type="text/plain")
    rsp['Access-Control-Allow-Origin'] = '*'

    return rsp
