var freshCounter = 0;

var lambdaSeparatorForHtml = '.'; // →
var lambdaHeadForHtml = 'λ';

var lambdaSeparatorForString = "→";
var lambdaHeadForString = "λ";

/* Each term has methods toString, toHTML, substitute, hasFree, and getFreeVars.
* Only Apply and Lambda have the method 'reduce'. Only 'Lambda' has the method 'apply'.
* Variables must be lowercase.
* The global 'reduce' method now has an option, keepLambdaBody = true, which is false by default.
* If this option is set to true, the lambda function body will never be reduced until application.
* */

function isEqual(term1, term2) {
  if (isVariable(term1) && isVariable(term2) && term1.getName() == term2.getName()) {
    return true;
  }
  if (isApply(term1) && isApply(term2) && isEqual(term1.getLeft(), term2.getLeft()) && isEqual(term1.getRight(), term2.getRight())) {
    return true;
  }
  if (isLambda(term1) && isLambda(term2)) {
    if (term1.getBoundName() == term2.getBoundName() && isEqual(term1.getBody(), term2.getBody())) {
      return true;
    }
    else {
      var term2AlphaConverted = term2.alphaConvert(term2.getBoundName(), term1.getBoundName());
      if (isEqual(term1.getBody(), term2AlphaConverted.getBody())) {
        return true;
      }
    }
  }
  return false;
}

function isVariable(term) {
  return Variable.prototype.isPrototypeOf(term);
}
function isLambda(term) {
  return Lambda.prototype.isPrototypeOf(term);
}
function isApply(term) {
  return Apply.prototype.isPrototypeOf(term);
}

function Variable(name) {
  if (!isIdentifier(name))
    throw "invalid variable name";

  this.toHTML = function(boundVars){
    if (typeof(boundVars)!=typeof([])) boundVars = [];
    var isFree = boundVars.indexOf(name) == -1;
    var htmlName = name;
    var subscript = '';
    if (name.match(/^[a-z][0-9]+$/)) {
      subscript = '<sub>' + name.substr(1) + '</sub>';
      htmlName = name.substr(0,1);
    }
    return "<i>" + (isFree ? "<b>" + htmlName + "</b>" : htmlName) + "</i>" + subscript;
  };

  this.toString = function () {
    return name;
  };

  // alpha conversion is the same as substitution for variables
  //this.alphaConvert = function(varName, newName) {
  //    return (varName == name) ? new Variable(newName) : this;
  //};

  this.substitute = function (varname, newterm) {
    if (name === varname)
      return newterm;
    else
     return this;
  };

  this.hasFree = function (varname) {
    return name === varname;
  };

  this.getFreeVars = function () {
    return [name];
  };

  this.getName = function () {
    return name;
  };

}

function isIdentifier(text) {
  return (text && typeof(text) == typeof("") && text.length > 0 && text.match(/^([a-z][0-9]*|[A-Z][a-z0-9]*)$/) );
}

function makeFreshName(boundVars) {
  var minIndex = 0;
  var shortVars = "xyzwvutsrabcdefghijklmnpq";

  if (boundVars) {
    boundVars.forEach(function(bVar){
      if (bVar.match(/^[a-z]$/)) {
        shortVars = shortVars.replace(bVar, '');
      }
      else if (bVar.match(/^v[0-9]+$/)) {
        var n = parseInt(bVar.substr(1));
        if (n>=minIndex) minIndex = n+1;
      }
    });
    var newName = (shortVars.length > 0) ? shortVars.charAt(0) : "v" + minIndex;
    return newName;
  }

  return shortVars.charAt(0);
}

function Lambda(boundName, lambdaBody) {

  this.getBoundName = function() {
    return boundName;
  };

  this.getBody = function() {
    return lambdaBody;
  };

  var boundVar = new Variable(boundName);

  this.toString = function () {
    return lambdaHeadForString + boundVar.toString() + lambdaSeparatorForString + lambdaBody.toString();
  };

  this.toHTML = function(boundVars) {
    if (typeof(boundVars)!=typeof([])) boundVars = [];
    return lambdaHeadForHtml + boundVar.toHTML([boundName]) + lambdaSeparatorForHtml + lambdaBody.toHTML([boundName].concat(boundVars));
  };

  // note: in the old code, we have two different substitutions, one for the bound variable - and it can only
  // be substituted by another variable, which is alpha-conversion - and another when we
  // substitute a free variable by a new term, which is beta-conversion
  // So actually we have to separate them! Otherwise we get a confusing (even though correct) alpha-conversion such as in
  // (\x.(\x.x)) p  yielding \p.p instead of \x.x

  // after alpha conversion, term should not have varname as a free variable. For example, convert (\x.xy) (x, z) will yield (\z.zy)
  this.alphaConvert = function(varName, newName) {
    if (boundName == varName && lambdaBody.hasFree(varName)) {
      var newBody = lambdaBody.substitute(varName, new Variable(newName));
      return new Lambda(newName, newBody);
    } else {
      return this;
    }
  };

  this.substitute = function (varName, newTerm) {
    // if we are substituting varName for newTerm but our own bound variable is the same as varName, we do not need to substitute anything.
    // if newTerm has the same free variable as our own bound name, we have a conflict. We need to alpha-convert ourselves to a new bound name.
    // otherwise, we can simply substitute the new term into our own body.
    if (boundName == varName) {
      return this;
    }

    if (newTerm.hasFree(boundName)) { // need alpha-conversion
      var newName = makeFreshName(lambdaBody.getFreeVars().concat(newTerm.getFreeVars())); // guarantee that newname is not free in our term or in newterm
      var term2 = lambdaBody.substitute(boundName, new Variable(newName)).substitute(varName, newTerm);
      return new Lambda(newName, term2);
    }

    return new Lambda(boundName, lambdaBody.substitute(varName, newTerm));

  };

  this.apply = function (newTerm) {
    // the variable 'name' may be either missing or present and free in 'newterm'.
    if (lambdaBody.hasFree(boundName)) {
      // any bound instances of 'name' in 'newterm' are ignored by the substitution.
      return lambdaBody.substitute(boundName, newTerm);
    } else {
      return lambdaBody;
    }
  };

  this.reduce = function(options) {
    if ( (options && options.keepLambdaBody) || !lambdaBody.reduce)
      return null;
    else {
      var newTerm = lambdaBody.reduce();
      if (newTerm) return new Lambda(boundName, newTerm);
      else
        return null;
    }
  };

  this.hasFree = function (varname) {
    return boundName !== varname && lambdaBody.hasFree(varname);
  };

  this.getFreeVars = function () {
    var termFreeVars = lambdaBody.getFreeVars();
    var index = termFreeVars.indexOf(boundName); // our variable is not free in the term if it occurs there
    if (index != -1) termFreeVars.splice(index, 1);
    return termFreeVars;
  };
}

function Apply(left, right) {

  this.getLeft = function() {
    return left;
  };

  this.getRight = function() {
    return right;
  };

  this.toHTML = function (boundVars) {
    if (typeof(boundVars)!=typeof([])) boundVars = [];
    var leftstr = left.toHTML(boundVars);
    var rightstr = right.toHTML(boundVars);

    if (isApply(right) || isLambda(right))
      rightstr = "(" + rightstr + ")";

    if (isLambda(left))
      leftstr = "(" + leftstr + ")";

    return leftstr + "&nbsp;" + rightstr;
  };

  this.toString = function () {
    var leftstr = left.toString();
    var rightstr = right.toString();

    if (isApply(right) || isLambda(right))
      rightstr = "(" + rightstr + ")";

    if (isLambda(left))
      leftstr = "(" + leftstr + ")";

    return leftstr + rightstr;
  };

// for Apply objects, alpha conversion is the same as substitution

  this.substitute = function (varname, newterm) {
    var newleft = left.substitute(varname, newterm);
    var newright = right.substitute(varname, newterm);

    if (newleft === left && newright === right)
      return this;
    else
      return new Apply(newleft, newright);
  };

  this.reduce = function (options) {
    var lazyEval = options && options.lazyEvaluation;
    if (isLambda(left)) {
      if (lazyEval)
        return left.apply(right);
      else {
        var rreduce = reduce(right);

        if (rreduce)
          return new Apply(left, rreduce);

        return left.apply(right);
      }
    } else {
      var lreduce = reduce(left);

      if (lreduce)
        return new Apply(lreduce, right);

      var rreduce = reduce(right);

      if (rreduce)
        return new Apply(left, rreduce);

      return null;
    }
  };

  this.hasFree = function (varname) {
    return left.hasFree(varname) || right.hasFree(varname);
  };

  this.getFreeVars = function () {
    return left.getFreeVars().concat(right.getFreeVars());
  };
}

function createApply(left, right) {
  return new Apply(left, right);
}

function createVariable(name) {
  return new Variable(name);
}

function createLambda(name, term) {
  return new Lambda(name, term);
}

function reduce(term, options) {
  if (term.reduce)
    return term.reduce(options);

  return null;
}


function parse(text) {
  var l = text.length;
  var p = 0;

  var result = parseTerms();
  if (p != l) {
    throw "Unexpected '" + text[p] + "'";
  } else {
    return result;
  }

  function parseTerms() {
    var term = null;

    for (var newterm = parseTerm(); newterm; newterm = parseTerm())
      if (term)
        term = new Apply(term, newterm);
      else
        term = newterm;

    return term;
  }

  function parseVarName() { // [a-z][0-9]* | [A-Z][a-z0-9]*

    var name = text[p];
    if (name >= 'a' && name <= 'z') {
      p++;
      while (p < l && text[p] <= '9' && text[p] >= '0') {
        name += text[p];
        p++;
      }
      return name;
    } else if (name >= 'A' && name <= 'Z') {
      p++;
      while (p < l && (text[p] <= '9' && text[p] >= '0' || text[p] <= 'z' && text[p] >= 'a')) {
        name += text[p];
        p++;
      }
      return name;
    } else {
      return null;
    }
  }

  function skipWhitespaceAndCheckEnd() {
    while (p < l && text[p] <= ' ')
      p++;
    return p>=l;
  }

  function parseFixedString(str) {
    if (str && str.length > 0 && p + str.length < l && text.substr(p, str.length) == str) {
      p += str.length;
      return true;
    } else {
      return false;
    }
  }

  function parseCharRange(range) {

    if (p < l && range.indexOf(text[p]) != -1) {
      p++;
      return true;
    } else {
      return false;
    }
  }

  // a term is an identifier or a lambda or ( term )
  function parseTerm() {
    if (skipWhitespaceAndCheckEnd()) return null;

    var varName = parseVarName();
    if (varName) return new Variable(varName);

    if (parseCharRange("\\λ" || parseFixedString(lambdaHeadForHtml))) {
      var name = parseVarName();

      if (!name)
        throw "Invalid argument name";

      // allow empty lambda separator, as well as a given set of separators
      if (parseCharRange(".→") || parseFixedString('->') || parseFixedString(lambdaSeparatorForHtml)) {}

      var body = parseTerms();
      return new Lambda(name, body);

    }

    if (parseCharRange("(")) {
      var term = parseTerms(); // true

      if (parseCharRange(")")) {
        return term;
      } else {
        throw "Unclosed term at position " + p + ", input string: " + text;
      }
    }

    return null;
  }
}
/*
module.exports = {
  createVariable: createVariable,
  createLambda: createLambda,
  createApply: createApply,
  isLambda: isLambda,
  isApply: isApply,
  isVariable: isVariable,
  isEqual: isEqual,
  reduce: reduce,
  parse: parse,
  setLambdaHead: function(lh){lambdaHeadForHtml = lh;},
  setLambdaSeparator:  function(lh){lambdaSeparatorForHtml = lh;}
};

*/
