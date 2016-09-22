/**
 * This widget renders a stache template in a div.
 * Properties passed into the widget constructor can be used
 * in the stache template.
 */

define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'can/view/stache',
  'can/util/library'
], function(declare, _WidgetBase, stache, can) {
  return declare([_WidgetBase], {
    /**
     * the template to render into a dom node
     * @type {String}
     */
    canTemplate: null,
    /**
     * renders the stache template in the node
     * @param  {DomNode} node The dom node to place the template
     */
    placeAt: function(node) {
      var renderer = can.stache(this.canTemplate);
      can.append(can.$(node), renderer(this));
    }
  });
});
