var godot       = require('godot'),
    godotirc    = require('godot-irc');

godot.reactor.register('irc', godotirc.reactor);

godot.createServer({
  type: 'tcp',
  multiplex: false,
  reactors: [
    godot.reactor()
      .console()
      .irc({
        server: 'irc.freenode.net',
        nick: 'gobot', 
        options: { 
          debug: false, 
          port: 8001, 
          channels: ['#gotbottest']
        }
      })
  ]
}).listen(1337);
