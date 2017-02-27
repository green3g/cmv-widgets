(function () {
    var path = location.pathname.replace(/[^\/]+$/, '');
    window.dojoConfig = {
        async: true,
        packages: [{
            name: 'widgets',
            location: path + 'widgets'
        }, {
            name: 'viewer',
            location: '//cdn.rawgit.com/cmv/cmv-app/develop/viewer/js/viewer'
        }, {
            name: 'gis',
            location: '//cdn.rawgit.com/cmv/cmv-app/develop/viewer/js/gis'
        }, {
            name: 'tmcgee',
            location: '//cdn.rawgit.com/tmcgee/cmv-widgets/49eb1e2f/widgets'
        }, {
            name: 'config',
            location: path + 'js/config'
        }
        ]
    };

    require(window.dojoConfig, [
        'dojo/_base/declare',

        // minimal Base Controller
        'viewer/_ControllerBase',

        // *** Controller Mixins
        // Use the core mixins, add custom mixins
        // or replace core mixins with your own
        'viewer/_ConfigMixin', // manage the Configuration
        'viewer/_LayoutMixin', // build and manage the Page Layout and User Interface
        'viewer/_MapMixin', // build and manage the Map
        'viewer/_WidgetsMixin' // build and manage the Widgets

        //'config/_customMixin'

    ], function (
        declare,

        _ControllerBase,
        _ConfigMixin,
        _LayoutMixin,
        _MapMixin,
        _WidgetsMixin

        //_MyCustomMixin

    ) {
        var controller = new(declare([
            _ConfigMixin,
            _LayoutMixin,
            _MapMixin,
            _WidgetsMixin,
            _ControllerBase
        ]))();
        controller.startup();
    });
})();
