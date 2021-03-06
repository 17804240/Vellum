define([
    'underscore',
    'fusejs',
    'vellum/datasources',
    'vellum/util',
], function (
    _,
    fusejs,
    datasources,
    util
) {
    var FUSE_CONFIG = {
        keys: ['label', 'name', 'absolutePath', 'hashtagPath'],
    };

    function Fuse(form) {
        var _this = this;
        this.form = form;

        datasources.getDataSources(function() {
            _this.dataset = generateNewFuseData(_this.form);
        });

        if (!this.dataset) {
            this.dataset = generateNewFuseData(form);
        }

        this.fusejs = new fusejs(this.dataset, FUSE_CONFIG);


        function addToDataset(e) {
            removeFromDataset(e);
            _this.dataset.push(mugToData(e.mug));
            _this.fusejs.set(_this.dataset);
        }

        function removeFromDataset(e) {
            _this.dataset = _.filter(_this.dataset, function (mug) {
                return mug.id !== e.mug.ufid;
            });
        }


        this.form.on('mug-property-change', function (e) {
            if (e.property === 'nodeID') {
                addToDataset(e);
            }
        }).on('question-label-text-change', addToDataset)
        .on('question-create', addToDataset)
        .on('question-remove', removeFromDataset);
    }

    Fuse.prototype = {
        list: function () {
            return this.fusejs.list;
        },
        search: function (query) {
            return this.fusejs.search(query);
        }
    };

    function mugToData(mug) {
        if (mug) {
            var defaultLabel = mug.form.vellum.getMugDisplayName(mug);

            return {
                id: mug.ufid,
                name: mug.absolutePath,
                hashtagPath: mug.hashtagPath,
                absolutePath: mug.absolutePath,
                displayPath: mug.form.useRichText ? mug.hashtagPath : mug.absolutePath,
                icon: mug.options.icon,
                questionId: mug.p.nodeID,
                displayLabel: util.truncate(defaultLabel),
                label: defaultLabel,
                mug: mug,
            };
        }
        return null;
    }

    function generateNewFuseData (form) {
        var caseData = [];
        if (form.vellum.data.core.databrowser && form.useRichText) {
            caseData = _.chain(form.vellum.data.core.databrowser.dataHashtags)
             .map(function(absolutePath, hashtag) {
                 return {
                     name: hashtag,
                     hashtagPath: hashtag,
                     absolutePath: absolutePath,
                     icon: 'fcc fcc-fd-case-property',
                     displayLabel: null,
                     displayPath: hashtag,
                 };
             })
             .value();
        }
        return _.chain(form.getMugList())
                .map(mugToData)
                .filter(function(choice) {
                    return choice.name && !_.isUndefined(choice.displayLabel);
                })
                .value().concat(caseData);
    }

    return Fuse;
});
