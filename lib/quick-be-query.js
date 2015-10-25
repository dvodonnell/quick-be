(function(mod){

    var QuickBEQuery = function(dataset) {

        this.model = {};

    };

    QuickBEQuery.prototype = {

        setKinds : function(kinds) {

            var len = kinds.length;

            if (len > 0 && !this.model.kinds) {
                this.model.kinds = [];
            }

            for (var i = 0; i < len; i++) {
                this.model.kinds.push({
                    name : kinds[i]
                });
            }

        },

        toObject : function() {
            return this.model;
        },

        setFilter : function(prop, val) {

            if (!this.model.filter) {
                this.model.filter = {
                    "compositeFilter": {
                        "operator": 'AND',
                        "filters": []
                    }
                };
            }

            this.model.filter.compositeFilter.filters.push({
                "propertyFilter" : {
                    "property": {
                        "name": prop
                    },
                    "operator" : "EQUAL",
                    "value" : {
                        "stringValue" : val
                    }
                }
            });

        }

    };

    mod.exports = QuickBEQuery;

})(module);