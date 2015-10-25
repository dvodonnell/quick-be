//quick-be

(function(mod){

    var libs = {
        gapi : require('googleapis'),
        express : require('express'),
        jwt : require('jsonwebtoken'),
        bodyParser : require('body-parser'),
        bcrypt : require('bcrypt-nodejs')
    };

    var QBEQuery = require('./lib/quick-be-query'),
        QBEEntity = require('./lib/quick-be-entity');

    var QuickBE = function(cfg) {

        this.cfg = cfg;

        this.auth = new libs.gapi.auth.JWT(
            this.cfg.datastore.credentials.client_email,
            null,
            this.cfg.datastore.credentials.private_key,
            [
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/datastore'
            ]
        );

        this.ds = libs.gapi.datastore({
            version: 'v1beta2',
            auth: this.auth,
            projectId: this.project,
            params: {datasetId: this.cfg.datastore.projectId}
        });

        this.srv = libs.express();

        this._setupServer();

    };

    QuickBE.prototype = {

        gapiAuth : function(callback) {

            this.auth.authorize(function(jwtErr) {
                if (jwtErr) {
                    console.log(jwtErr);
                } else {
                    callback();
                }
            });

        },

        run : function() {

            var self = this;

            this.gapiAuth(function(){

                console.log('Authentication successful...');
                self.srv.listen(self.cfg.server.port);
                console.log('Listening on port '+self.cfg.server.port+'...');

            });

        },

        _setupServer : function() {

            var self = this;

            this.srv.use( libs.bodyParser.json() );
            this.srv.use( libs.bodyParser.urlencoded({
                extended: true
            }));

            this.srv.use(function(req, res, next) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type');
                next();
            });

            //authentication

            this.srv.post('/auth', function(req, res){

                var postData = req.body;

                var q = new QBEQuery();
                q.setKinds(['user']);
                q.setFilter('email', 'dan@dvoc.ca');

                self._dsQuery(q, function(resp){
                    if (resp.length >= 1) {
                        var user = resp[0];
                        if (libs.bcrypt.compareSync(postData.password, user.password.stringValue)) {
                            res.json({
                                success:true,
                                data : {
                                    token : libs.jwt.sign({}, 'shhhhh', {
                                        subject : user.email
                                    })
                                }
                            });
                        } else {
                            res.json({success:false});
                        }
                    } else {
                        res.json({success:false});
                    }
                });

            });

            this.srv.post('/register', function(req, res){

                var postData = req.body;

                var newUser = new QBEEntity('user');

                newUser.setParameters({
                    email : postData.id || null,
                    password : libs.bcrypt.hashSync(postData.password)
                });

                self._dsCommit(newUser, function(resp){
                    res.json(resp);
                });

            });

            //get

            this.srv.get('/find', function(req, res){

                var q = new QBEQuery();

                q.setKinds([req.query.kind]);

                if (req.query.filters) {
                    for (var prop in req.query.filters) {
                        if( obj.hasOwnProperty( prop ) ) {
                            q.setFilter(prop, req.query.filters[prop]);
                        }
                    }
                }

                self._dsQuery(q, function(resp){
                    res.json({
                        success : true,
                        data : resp
                    })
                });

            });

            //insert

            this.srv.post('/save', function(req, res){

                var postData = req.body,
                    newEntity = new QBEEntity(postData.kind);

                newEntity.setParameters(postData.properties);

                self._dsCommit(newEntity, function(resp){
                    res.json(resp);
                });

            });


        },

        _dsQuery : function(QBQuery, callback) {

            var self = this;

            var query = {
                resource: {
                    query: QBQuery.toObject()
                }
            };

            this.ds.datasets.runQuery(query, function(err, result){
                if (err) {
                    console.log(err);
                } else {
                    callback(self._processResults(result.batch.entityResults));
                }
            });

        },

        _dsCommit : function(QBEntity, callback) {
            var commit = {
                resource: {
                    mutation: {
                        insertAutoId: [QBEntity.toObject()]
                    },
                    mode: 'NON_TRANSACTIONAL'
                }
            };
            this.ds.datasets.commit(commit, function(err, result){
                if (err) {
                    console.log(err);
                } else {
                    callback(result);
                }
            });
        },

        _processResults : function(arr) {

            var results = [];

            for (var i = 0; i < arr.length; i++) {
                if (arr[i].entity) {
                    var formatted = arr[i].entity.properties;
                    formatted['id'] = arr[i].entity.key.path[0].id;
                    formatted['kind'] = arr[i].entity.key.path[0].kind;
                    results.push(formatted);
                }
            }

            return results;

        }

    };

    mod.exports = QuickBE;

})(module);