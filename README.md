# Cambridge Car Park Monitor

A rather hastily written node app that parses the HTML-only output of
the Cambridge City car park "API", which returns the number of spaces
available and some extra, unparsed info (percentage full, and status).

Every 5 minutes the script gets the car park space page, parses it, and
uses Bunyan to log it to a file as JSON (lazy DB!).

## Installation

Not much to it. You need mongodb (sorry, not my fault [well, ok, maybe a
little bit]).

```
npm install
<magically install mongodb>

node index.js
```
