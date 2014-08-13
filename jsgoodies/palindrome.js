var isPalindrome = function (str) {
  var _str = str.replace(/ /g,'').toLowerCase();
  return _str.split('').reverse().join('') === _str;
};
alert(isPalindrome("Sail on game vassal Lacy callas save magnolias"));	