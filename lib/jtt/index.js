'use strict';

module.exports = function(app) {

require('./register')(app);
require('./media')(app);
require('./rsa')(app);
require('./position')(app);

}
