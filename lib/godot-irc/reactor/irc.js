/*
 * irc.js: Stream responsible for sending irc message on data events.
 *
 * @obazoud
 *
 * Important: set mulitplex to false to create only one bot
 *
 * Configuration sample:
 *
 *  godot.createServer({
 *    type: 'tcp',
 *    multiplex: false,
 *    reactors: [
 *      godot.reactor()
 *        .irc({
 *          server: 'irc.freenode.net',
 *          nick: 'gobot', 
 *          options: { 
 *            debug: false, 
 *            port: 8001, 
 *            channels: ['#gotbottest']
 *          }
 *        })
 *    ]
 *  }).listen(1337);
 *
 *
 */

var utile       = require('utile'),
    path        = require('path'),
    irc         = require('irc');

godotPath       = path.dirname(require.resolve('godot'));
ReadWriteStream = require(godotPath + '/godot/common').ReadWriteStream;

//
// ### function Irc (options)
// #### @options {Object} Options for sending irc message.
// ####   @options.server   {string} The server to connect to.
// ####   @options.nick     {string} The nickname to attempt to use.
// ####   @options.options  {Object} An options object 
//                                   values https://node-irc.readthedocs.org/en/latest/API.html
// Constructor function for the Irc stream responsible for sending
// irc message on data events.
// 
//
var Irc = module.exports = function Irc(options) {
  if (!options || !options.server || !options.nick) {
    throw new Error('options.server and options.nick are required');
  }
  if (!options.options.channels || options.options.channels.length == 0) {
    throw new Error('at least one options.options.channels is required');
  }

  ReadWriteStream.call(this);

  this.server     = options.server;
  this.nick       = options.nick;
  this.options    = options.options;
  this.interval   = options.interval;
  this._last      = 0;
  this._joined = false;

  this.format  = options.formatter || this.formatter;

  this.bot  = options.bot || new irc.Client(this.server, this.nick, this.options);
  
  var self = this;
  this.bot.on('error', function(message) {
    self._joined = false;
  });
  this.bot.on('join', function(channel, who) {
    if (who == this.nick) {
      self._joined = true;
    }
  });

};

//
// Inherit from ReadWriteStream.
//
utile.inherits(Irc, ReadWriteStream);

//
// ### function write (data)
// #### @data {Object} JSON to send irc message
// Sends an irc message with the specified `data`.
//
Irc.prototype.write = function (data) {
  var text = JSON.stringify(data, null, 2),
      self = this;

  //
  // Return immediately if we have sent a message
  // in a time period less than `this.interval`.
  //
  if (this.interval && this._last
      && ((new Date()) - this._last) <= this.interval) {
    return;
  }

  self._last = new Date();
  
  if (this._joined) {
    this.bot.say(this.options.channels, this.format(data));
  }

  return self.emit('data', data);
}

Irc.prototype.formatter = function (data) {
  var message = Object.keys(data).map(function(x) {
    return [x, data[x]].join(': ');
  }).join(', ');
  return message;
};
