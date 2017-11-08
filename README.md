# "Logic Board" Plugin
This homebridge plugin allows complex binary logic. And you'll need some knowledge of programming and javascript to use it.


## How to install

 ```(sudo) npm install -g homebridge-logic-board```
 
## Example config.json:

 ```
    "accessories": [
        {
			"accessory": "LogicBoard",
			"name": "Logic Board Name",
			"inputs": [
				{
					"varName" : "a",
					"displayName" : "a switch"
				},
				{
					"varName" : "b",
					"displayName" : "b switch"
				}
			],
			"outputs": [
				{
					"varName" : "x",
					"displayName" : "x result"
				},
				{
					"varName" : "y",
					"displayName" : "y result"
				}
			],
			"eval": "x = a;y = a && b;"
		} 
    ]
```

All "inputs" will be interpreted as a swtich in homekit, and all "outputs" will be a occupancy sensor.
"varName" should be a valid name for variable name in js.
"eval" should be a valid js expression.


