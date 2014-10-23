(function(){
'use strict';
/* globals d3, _ */
/* globals Backbone */

var Logger = Backbone.Model.extend(
/** @lends Logger.prototype */
{
    defaults: function(){
        return {
            element: null,
            logs: [],
            maxLogsToHold: 3
        };
    },

    /**
     * Creates holder for logging within specified container
     * @classdesc Logs above game board to show some technical messages
     * @constructs
     * @augments Backbone.Model
     * @param {string} containerId Container id for d3.select()
     * @return {Logger} Newly created logger object.
     */
    initialize: function(containerId){
        var container = d3.select(containerId),
            oldContainerStyle = container.attr('style'),
            loggerEl, logger;
        container.attr('style', 'position: relative;' + oldContainerStyle);

        loggerEl = container.append('div');
        loggerEl.attr('style', 'position:absolute; top:0; right:0;');
        this.set('element', loggerEl);

        _.bindAll(this, 'log');

        return this;
    },

    /**
     * Logs message to its logger element
     * @param {string} msg The message to log
     */
    log: function(msg){
        var loggerEl = this.get('element'),
            log = loggerEl.append('div'),
            logs = this.get('logs');

        log.html(msg);
        logs.push(log);
        if (logs.length > this.get('maxLogsToHold')){
            logs.shift().remove();
        }
    }

});
window.Logger = Logger;


})();
