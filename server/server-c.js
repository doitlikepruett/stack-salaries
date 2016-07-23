'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _user = require('./models/user');

var _user2 = _interopRequireDefault(_user);

var _stackdata = require('./models/stackdata');

var _stackdata2 = _interopRequireDefault(_stackdata);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _bcryptNodejs = require('bcrypt-nodejs');

var _bcryptNodejs2 = _interopRequireDefault(_bcryptNodejs);

var _jwtSimple = require('jwt-simple');

var _jwtSimple2 = _interopRequireDefault(_jwtSimple);

var _secret = require('./secret');

var _secret2 = _interopRequireDefault(_secret);

var _passport = require('./passport/passport');

var _passport2 = _interopRequireDefault(_passport);

var _local = require('./passport/local');

var _local2 = _interopRequireDefault(_local);

var _github = require('./passport/github');

var _github2 = _interopRequireDefault(_github);

var _passport3 = require('passport');

var _passport4 = _interopRequireDefault(_passport3);

var _expressPassportLogout = require('express-passport-logout');

var _expressPassportLogout2 = _interopRequireDefault(_expressPassportLogout);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _server = require('react-dom/server');

var _reactRouter = require('react-router');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var routes = require('./compiled/src/bundle').default;
var SD = require('./controllers/stackdataController');

var app = (0, _express2.default)();

app.use((0, _morgan2.default)('dev'));
app.use(_bodyParser2.default.urlencoded({ extended: true }));
app.use(_bodyParser2.default.json());
app.use(_express2.default.static(_path2.default.join(__dirname, '../client/compiled')));

// Mongoose Connection (Refactor into Separate File)
var databaseURL = process.env.MONGOLABS || 'mongodb://localhost:27017/stack-salaries';

_mongoose2.default.connect(databaseURL);

// Helper Methods (Refactor into Separate File)
function generateToken(user) {
  // Add issued at timestamp and subject
  // Based on the JWT convention
  var timestamp = new Date().getTime();
  return _jwtSimple2.default.encode({ sub: user.id, iat: timestamp }, _secret2.default.secret);
}

// Set to false since tokens are being used
// This is Passport Authentication setup
// Github auth will be added here as well
var requireAuth = _passport4.default.authenticate('jwt', { session: false });
var requireSignIn = _passport4.default.authenticate('local', { session: false });
var githubAuth = _passport4.default.authenticate('github', { session: false, successRedirect: '/', failureRedirect: '/login' });

// Allow all headers
app.all('*', function (req, res, next) {

  res.header('Access-Control-Allow-Origin', '*');

  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE');

  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
});

//Search for any field
app.post('/search', function (req, res, next) {
  SD.querySalary(req.body, function (results) {
    res.json(results);
  });
});

// Add a Stack Entry
app.post('/stackentry', function (req, res, next) {
  SD.createSalary(req.body, function (result) {
    res.status(201);
    res.json(result);
  });
});

// GET all users
app.get('/users', requireAuth, function (req, res, next) {
  _user2.default.find({}, function (err, users) {
    if (!err) {
      res.send(200, users);
    } else {
      throw err;
    }
  });
});

app.get('/users/:id', function (req, res, next) {
  var id = req.params.id;

  // A friendly error to display if no user matches the id
  var err = "No such user with the given id";

  _user2.default.findOne({ id: id }, function (err, existingUser) {
    if (err) {
      res.send(err);
    } else {
      res.json(existingUser);
    }
  });
});

// The middleware will verify credentials
// If successful, hand a token
app.post('/signin', requireSignIn, function (req, res, next) {
  var userToken = generateToken(req.user);

  res.send({ token: userToken });
});

app.post('/signup', function (req, res, next) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;

  // Validation to check if all the fields were being passed
  if (!email || !password || !name) {
    return res.send(422, { error: "Please fill out all the fields" });
  }

  // Check email already exists
  _user2.default.findOne({ email: email }, function (err, existingUser) {

    if (err) {
      return next(err);
    }

    // If it does, return "existing account" message
    if (existingUser) {
      // Return unprocessable entity
      return res.send(422, { error: 'Email is in use' });
    }

    // If not, create and save user
    var user = new _user2.default({
      name: name,
      email: email,
      password: password
    });

    user.save(function (err) {
      if (err) {
        return next(err);
      }

      // Send user back a JWT upon successful account creation
      res.json({ token: generateToken(user) });
    });
  });
});

app.get('/logout', (0, _expressPassportLogout2.default)(), function (req, res, next) {
  res.redirect('/login');
});

// Root Path
app.get('*', function (req, res, next) {
  (0, _reactRouter.match)({ routes: routes, location: req.url }, function (error, redirectLocation, renderProps) {
    if (error) {
      res.status(500).send(error.message);
    } else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      // You can also check renderProps.components or renderProps.routes for
      // your "not found" component or route respectively, and send a 404 as
      // below, if you're using a catch-all route.
      res.status(200).send((0, _server.renderToString)(_react2.default.createElement(_reactRouter.RouterContext, renderProps)));
    } else {
      res.status(404).send('Not found');
    }
  });
});

var port = process.env.PORT || 3000;

app.listen(port);
console.log('Server now listening on port ' + port);

module.exports = app;

//# sourceMappingURL=data:application/json;base64,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QUksV0FBSixFQUFpQjs7OztBQUl0QixVQUFJLE1BQUosQ0FBVyxHQUFYLEVBQWdCLElBQWhCLENBQXFCLDRCQUFlLDBEQUFtQixXQUFuQixDQUFmLENBQXJCO0FBQ0QsS0FMTSxNQUtBO0FBQ0wsVUFBSSxNQUFKLENBQVcsR0FBWCxFQUFnQixJQUFoQixDQUFxQixXQUFyQjtBQUNEO0FBQ0YsR0FiRDtBQWNELENBZkQ7O0FBaUJBLElBQUksT0FBTyxRQUFRLEdBQVIsQ0FBWSxJQUFaLElBQW9CLElBQS9COztBQUVBLElBQUksTUFBSixDQUFXLElBQVg7QUFDQSxRQUFRLEdBQVIsQ0FBWSxrQ0FBa0MsSUFBOUM7O0FBRUEsT0FBTyxPQUFQLEdBQWlCLEdBQWpCIiwiZmlsZSI6InNlcnZlci1jLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgYm9keVBhcnNlciBmcm9tICdib2R5LXBhcnNlcic7XG5pbXBvcnQgbW9yZ2FuIGZyb20gJ21vcmdhbic7XG5pbXBvcnQgbW9uZ29vc2UgZnJvbSAnbW9uZ29vc2UnO1xuaW1wb3J0IFVzZXIgZnJvbSAnLi9tb2RlbHMvdXNlcic7XG5pbXBvcnQgU3RhY2tEYXRhIGZyb20gJy4vbW9kZWxzL3N0YWNrZGF0YSc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBjb3JzIGZyb20gJ2NvcnMnO1xuaW1wb3J0IGJjcnlwdCBmcm9tICdiY3J5cHQtbm9kZWpzJztcbmltcG9ydCBqd3QgZnJvbSAnand0LXNpbXBsZSc7XG5pbXBvcnQgc2VjcmV0IGZyb20gJy4vc2VjcmV0JztcbmltcG9ydCBwYXNzcG9ydEF1dGggZnJvbSAnLi9wYXNzcG9ydC9wYXNzcG9ydCc7XG5pbXBvcnQgbG9jYWxBdXRoIGZyb20gJy4vcGFzc3BvcnQvbG9jYWwnO1xuaW1wb3J0IGdpdGh1YiBmcm9tICcuL3Bhc3Nwb3J0L2dpdGh1Yic7XG5pbXBvcnQgcGFzc3BvcnQgZnJvbSAncGFzc3BvcnQnO1xuaW1wb3J0IGxvZ291dCBmcm9tICdleHByZXNzLXBhc3Nwb3J0LWxvZ291dCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgcmVuZGVyVG9TdHJpbmcgfSBmcm9tICdyZWFjdC1kb20vc2VydmVyJ1xuaW1wb3J0IHsgbWF0Y2gsIFJvdXRlckNvbnRleHQgfSBmcm9tICdyZWFjdC1yb3V0ZXInXG52YXIgcm91dGVzID0gcmVxdWlyZSgnLi9jb21waWxlZC9zcmMvYnVuZGxlJykuZGVmYXVsdDtcbnZhciBTRCA9IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvc3RhY2tkYXRhQ29udHJvbGxlcicpO1xuXG52YXIgYXBwID0gZXhwcmVzcygpO1xuXG5hcHAudXNlKG1vcmdhbignZGV2JykpO1xuYXBwLnVzZShib2R5UGFyc2VyLnVybGVuY29kZWQoeyBleHRlbmRlZDogdHJ1ZSB9KSk7XG5hcHAudXNlKGJvZHlQYXJzZXIuanNvbigpKTtcbmFwcC51c2UoZXhwcmVzcy5zdGF0aWMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2NsaWVudC9jb21waWxlZCcpKSk7XG5cblxuLy8gTW9uZ29vc2UgQ29ubmVjdGlvbiAoUmVmYWN0b3IgaW50byBTZXBhcmF0ZSBGaWxlKVxudmFyIGRhdGFiYXNlVVJMID0gcHJvY2Vzcy5lbnYuTU9OR09MQUJTIHx8J21vbmdvZGI6Ly9sb2NhbGhvc3Q6MjcwMTcvc3RhY2stc2FsYXJpZXMnXG5cbm1vbmdvb3NlLmNvbm5lY3QoZGF0YWJhc2VVUkwpO1xuXG4vLyBIZWxwZXIgTWV0aG9kcyAoUmVmYWN0b3IgaW50byBTZXBhcmF0ZSBGaWxlKVxuZnVuY3Rpb24gZ2VuZXJhdGVUb2tlbih1c2VyKXtcbiAgLy8gQWRkIGlzc3VlZCBhdCB0aW1lc3RhbXAgYW5kIHN1YmplY3RcbiAgLy8gQmFzZWQgb24gdGhlIEpXVCBjb252ZW50aW9uXG4gIHZhciB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgcmV0dXJuIGp3dC5lbmNvZGUoeyBzdWI6IHVzZXIuaWQsIGlhdDogdGltZXN0YW1wIH0sIHNlY3JldC5zZWNyZXQpO1xufVxuXG4vLyBTZXQgdG8gZmFsc2Ugc2luY2UgdG9rZW5zIGFyZSBiZWluZyB1c2VkXG4vLyBUaGlzIGlzIFBhc3Nwb3J0IEF1dGhlbnRpY2F0aW9uIHNldHVwXG4vLyBHaXRodWIgYXV0aCB3aWxsIGJlIGFkZGVkIGhlcmUgYXMgd2VsbFxudmFyIHJlcXVpcmVBdXRoID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdqd3QnLCB7IHNlc3Npb246IGZhbHNlIH0gKTtcbnZhciByZXF1aXJlU2lnbkluID0gcGFzc3BvcnQuYXV0aGVudGljYXRlKCdsb2NhbCcsIHsgc2Vzc2lvbjogZmFsc2UgfSk7XG52YXIgZ2l0aHViQXV0aCA9IHBhc3Nwb3J0LmF1dGhlbnRpY2F0ZSgnZ2l0aHViJywgeyBzZXNzaW9uOiBmYWxzZSwgc3VjY2Vzc1JlZGlyZWN0OiAnLycsIGZhaWx1cmVSZWRpcmVjdDogJy9sb2dpbid9KTtcblxuLy8gQWxsb3cgYWxsIGhlYWRlcnNcbmFwcC5hbGwoJyonLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO+KAqFxuICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ1BVVCwgR0VULCBQT1NULCBERUxFVEUnKTvigKhcbiAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdDb250ZW50LVR5cGUnKTvigKhcbiAgbmV4dCgpO+KAqFxufSk7XG5cbi8vU2VhcmNoIGZvciBhbnkgZmllbGRcbmFwcC5wb3N0KCcvc2VhcmNoJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpe1xuICBTRC5xdWVyeVNhbGFyeShyZXEuYm9keSwgZnVuY3Rpb24ocmVzdWx0cyl7XG4gICAgcmVzLmpzb24ocmVzdWx0cyk7XG4gIH0pO1xufSlcblxuLy8gQWRkIGEgU3RhY2sgRW50cnlcbmFwcC5wb3N0KCcvc3RhY2tlbnRyeScsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KXtcbiAgU0QuY3JlYXRlU2FsYXJ5KHJlcS5ib2R5LCBmdW5jdGlvbihyZXN1bHQpe1xuICAgIHJlcy5zdGF0dXMoMjAxKTtcbiAgICByZXMuanNvbihyZXN1bHQpO1xuICB9KVxufSk7XG5cbi8vIEdFVCBhbGwgdXNlcnNcbmFwcC5nZXQoJy91c2VycycsIHJlcXVpcmVBdXRoLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCl7XG4gIFVzZXIuZmluZCh7fSwgZnVuY3Rpb24oZXJyLCB1c2Vycyl7XG4gICAgaWYoIWVycikge1xuICAgICAgcmVzLnNlbmQoMjAwLCB1c2Vycyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xufSk7XG5cbmFwcC5nZXQoJy91c2Vycy86aWQnLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCl7XG4gIHZhciBpZCA9IHJlcS5wYXJhbXMuaWQ7XG5cbiAgLy8gQSBmcmllbmRseSBlcnJvciB0byBkaXNwbGF5IGlmIG5vIHVzZXIgbWF0Y2hlcyB0aGUgaWRcbiAgdmFyIGVyciA9IFwiTm8gc3VjaCB1c2VyIHdpdGggdGhlIGdpdmVuIGlkXCI7XG5cbiAgIFVzZXIuZmluZE9uZSh7IGlkOiBpZH0sIGZ1bmN0aW9uKGVyciwgZXhpc3RpbmdVc2VyKXtcbiAgICBpZihlcnIpIHtcbiAgICAgIHJlcy5zZW5kKGVycik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5qc29uKGV4aXN0aW5nVXNlcik7XG4gICAgfVxuICAgfSk7XG59KTtcblxuLy8gVGhlIG1pZGRsZXdhcmUgd2lsbCB2ZXJpZnkgY3JlZGVudGlhbHNcbi8vIElmIHN1Y2Nlc3NmdWwsIGhhbmQgYSB0b2tlblxuYXBwLnBvc3QoJy9zaWduaW4nLCByZXF1aXJlU2lnbkluLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCl7XG4gIHZhciB1c2VyVG9rZW4gPSBnZW5lcmF0ZVRva2VuKHJlcS51c2VyKTtcblxuICByZXMuc2VuZCh7dG9rZW46IHVzZXJUb2tlbiB9KTtcbn0pO1xuXG5hcHAucG9zdCgnL3NpZ251cCcsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KXtcbiAgdmFyIG5hbWUgPSByZXEuYm9keS5uYW1lO1xuICB2YXIgZW1haWwgPSByZXEuYm9keS5lbWFpbDtcbiAgdmFyIHBhc3N3b3JkID0gcmVxLmJvZHkucGFzc3dvcmQ7XG5cbiAgLy8gVmFsaWRhdGlvbiB0byBjaGVjayBpZiBhbGwgdGhlIGZpZWxkcyB3ZXJlIGJlaW5nIHBhc3NlZFxuICBpZighZW1haWwgfHwgIXBhc3N3b3JkIHx8ICFuYW1lKXtcbiAgICByZXR1cm4gcmVzLnNlbmQoNDIyLCB7ZXJyb3I6IFwiUGxlYXNlIGZpbGwgb3V0IGFsbCB0aGUgZmllbGRzXCJ9KTtcbiAgfVxuXG4gIC8vIENoZWNrIGVtYWlsIGFscmVhZHkgZXhpc3RzXG4gIFVzZXIuZmluZE9uZSh7IGVtYWlsOiBlbWFpbH0sIGZ1bmN0aW9uKGVyciwgZXhpc3RpbmdVc2VyKXtcblxuICAgIGlmKGVycikgeyByZXR1cm4gbmV4dChlcnIpOyB9XG5cbiAgICAvLyBJZiBpdCBkb2VzLCByZXR1cm4gXCJleGlzdGluZyBhY2NvdW50XCIgbWVzc2FnZVxuICAgIGlmKGV4aXN0aW5nVXNlcil7XG4gICAgICAvLyBSZXR1cm4gdW5wcm9jZXNzYWJsZSBlbnRpdHlcbiAgICAgIHJldHVybiByZXMuc2VuZCg0MjIsIHsgZXJyb3I6ICdFbWFpbCBpcyBpbiB1c2UnIH0pO1xuICAgIH1cblxuICAgIC8vIElmIG5vdCwgY3JlYXRlIGFuZCBzYXZlIHVzZXJcbiAgICB2YXIgdXNlciA9IG5ldyBVc2VyKHtcbiAgICAgIG5hbWU6IG5hbWUsXG4gICAgICBlbWFpbDogZW1haWwsXG4gICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgfSk7XG5cbiAgICB1c2VyLnNhdmUoZnVuY3Rpb24oZXJyKXtcbiAgICAgIGlmIChlcnIpIHsgcmV0dXJuIG5leHQoZXJyKTsgfVxuXG4gICAgICAvLyBTZW5kIHVzZXIgYmFjayBhIEpXVCB1cG9uIHN1Y2Nlc3NmdWwgYWNjb3VudCBjcmVhdGlvblxuICAgICAgcmVzLmpzb24oeyB0b2tlbjogZ2VuZXJhdGVUb2tlbih1c2VyKX0pO1xuICAgIH0pO1xuXG4gIH0pO1xuXG59KTtcblxuYXBwLmdldCgnL2xvZ291dCcsIGxvZ291dCgpLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCl7XG4gIHJlcy5yZWRpcmVjdCgnL2xvZ2luJyk7XG59KTtcblxuLy8gUm9vdCBQYXRoXG5hcHAuZ2V0KCcqJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgbWF0Y2goeyByb3V0ZXMsIGxvY2F0aW9uOiByZXEudXJsIH0sIChlcnJvciwgcmVkaXJlY3RMb2NhdGlvbiwgcmVuZGVyUHJvcHMpID0+IHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kKGVycm9yLm1lc3NhZ2UpXG4gICAgfSBlbHNlIGlmIChyZWRpcmVjdExvY2F0aW9uKSB7XG4gICAgICByZXMucmVkaXJlY3QoMzAyLCByZWRpcmVjdExvY2F0aW9uLnBhdGhuYW1lICsgcmVkaXJlY3RMb2NhdGlvbi5zZWFyY2gpXG4gICAgfSBlbHNlIGlmIChyZW5kZXJQcm9wcykge1xuICAgICAgLy8gWW91IGNhbiBhbHNvIGNoZWNrIHJlbmRlclByb3BzLmNvbXBvbmVudHMgb3IgcmVuZGVyUHJvcHMucm91dGVzIGZvclxuICAgICAgLy8geW91ciBcIm5vdCBmb3VuZFwiIGNvbXBvbmVudCBvciByb3V0ZSByZXNwZWN0aXZlbHksIGFuZCBzZW5kIGEgNDA0IGFzXG4gICAgICAvLyBiZWxvdywgaWYgeW91J3JlIHVzaW5nIGEgY2F0Y2gtYWxsIHJvdXRlLlxuICAgICAgcmVzLnN0YXR1cygyMDApLnNlbmQocmVuZGVyVG9TdHJpbmcoPFJvdXRlckNvbnRleHQgey4uLnJlbmRlclByb3BzfSAvPikpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKCdOb3QgZm91bmQnKVxuICAgIH1cbiAgfSlcbn0pO1xuXG52YXIgcG9ydCA9IHByb2Nlc3MuZW52LlBPUlQgfHwgMzAwMDtcblxuYXBwLmxpc3Rlbihwb3J0KTtcbmNvbnNvbGUubG9nKCdTZXJ2ZXIgbm93IGxpc3RlbmluZyBvbiBwb3J0ICcgKyBwb3J0KTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcHA7Il19