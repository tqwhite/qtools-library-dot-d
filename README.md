# qtools-library-dot-d

# NOT READY. STILL WORKING IT OUT.

NAME

    qtools-library-dot-d

DESCRIPTION

Utility provides tools to scan a directory for NodeJS modules, require() them into existance with tools to connect them to a system.



First use case is adding endpoints to an expressJS system. When instantiated, qtDotD

scans a directory containing modules, dotLib.d. It requires it with two parameters,

dotD and passThroughArgs. For this case, passThrough args has two properties, 

expressApp and routingPrefix. The module uses these to construct one or more 

expressJS endpoitns.



the dotD object contains three parameters, add....




