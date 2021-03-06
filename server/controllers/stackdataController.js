var SD = require('../models/stackdata');

//takes the object that's sent to the server
// and modifies it into a query for mongoose.
var getQuery = function(query, callback){
  var clear = {}
  for(var k in query){
    if(k === 'stack' && query[k].length > 0){
      clear['stack'] = {$all: query[k]};
    } else if (query[k] && query[k].length > 0){
      clear[k] = query[k];
    }
  }
  console.log(clear);
  callback(clear);
}

//uses the query from getQuery to perform a search in mongoose
// to get a list of salaries back.
var getSalary = function(query, callback){
  getQuery(query, function(results){
    SD.find(results, {salary: 1, _id : 0}).exec(function(err, results){
      if(err) return handleError(err);
      callback(results);
    })
  });
};

//takes the object that's sent to the server and
// converts it to be made into a salary entry.
exports.createSalary = function(data, callback){
  for(var k in data){
    if(typeof(data[k]) === 'string'){
      data[k] = data[k].toLowerCase();
    }
    if(k === 'stack'){
      for(var i = 0; i < data[k].length; i++){
        data[k][i] = data[k][i].toLowerCase();
      }
    }
  }
  var newSD = new SD (data);
  newSD.save(function(err){
    if(err) return handleError(err);
    callback(newSD);
  })
};

//Calculates the lowest salary, average salary, and highest salary
// from the results of getSalary
var calculateSalary = function(query, callback){
  getSalary(query, function(results){
    var salaries = [];
    var calcSalary = {};
    if(results.length > 0){
      for(var s of results){
        salaries.push(s.salary);
      }

      salaries.sort((a,b) => a - b);

      calcSalary.lowest = salaries[0];
      calcSalary.highest = salaries[salaries.length - 1];
      calcSalary.average = Math.floor(salaries.reduce((a, b) => a + b, 0)/salaries.length);
    } else {
      calcSalary.lowest = 0;
      calcSalary.highest = 0;
      calcSalary.average = 0;
    }

    callback(calcSalary);
  });
}

//Creates a label and adds it to the object created
// from calculateSalary and returns that object
exports.querySalary = function(query, callback){
  calculateSalary(query, function(result){
    if(result.average !== 0){
      var title = 'Salaries for';
      if (Array.isArray(query.stack)){
        for (var s of query.stack){
          title += ' ' + s.charAt(0).toUpperCase() + s.slice(1);
        }
      }
      if (query.city){
        var cityName = query.city.split(' ');
        var cityNameUpper = [];
        for(var c of cityName){
          cityNameUpper.push(c.charAt(0).toUpperCase() + c.slice(1));
        }
        title += ' in ' + cityNameUpper.join(' ');
      }
      if (query.city && query.state) title += ', ' + query.state.toUpperCase();
      if (query.state && !query.city)  title += ' in ' + query.statetoUpperCase();
      result.label = title;
    } else {
      result.label = 'No results found'
    }
    callback(result)
  });
}