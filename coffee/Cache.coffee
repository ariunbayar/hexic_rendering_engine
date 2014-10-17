Cache =
  get: (key, default_value) ->
    if key of @ then @[key] else default_value

  set: (key, value) ->
    @[key] = value

  call: (key, func, context) ->
    unless key of @
      @[key] = func.apply(context, Array.prototype.slice.call(arguments, 3))
    @[key]

