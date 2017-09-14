# relayJSON
A 1 file js library, to handle recursive structures, classes, functions and regular expressions when converting to JSON.

# example
```js
var n = {
    something:{
        func: function(){
            console.log("something")
        }, 
        regex: /.*/
    }, 
    text:"test"
};
n.something.n = n; //create circular/recursive structure

var json = relayJSON.stringify(n, null, 4); //create pretty json, just as you would do with normal JSON
```

now json would look something like this:
```json
{
    "something": {
        "func": "function:[{ _=function (){console.log(\"something\")} }]",
        "regex": "regex:[{ /.*/ }]",
        "n": "object:[{ 2: }]"
    },
    "text": "string:[{ test }]"
}
```
The notation can quite easily be changed by changing the constants in relayJSON.js

`object:` refers to a circular object structure, this structure will be restored by relayJSON.parse():

```js
var originalObject = relayJSON.parse(json);
```

This system is however not able to restore function scopes, or depencencies of classes and functions
