(function(mod){

    var QuickBEEntity = function(kind) {
        this.model = {
            key : {
                path : [
                    {
                        kind : kind
                    }
                ]
            },
            properties: {}
        };
    };
    QuickBEEntity.prototype = {

        setParameters : function(pars) {
            for (var attrName in pars) {
                this.setParameter(attrName, pars[attrName]);
            }
        },

        setParameter : function(key, val) {

            var type = 'string';

            if (Number(val) === val && val % 1 === 0) {
                type = 'integer';
            } else if (typeof(val) === "boolean") {
                type = 'boolean';
            }

            var parEntry = {};
            parEntry[type+'Value'] = val;

            this.model.properties[key] = parEntry;
        },

        toObject : function(){
            return this.model;
        }
    };

    mod.exports = QuickBEEntity;

})(module);