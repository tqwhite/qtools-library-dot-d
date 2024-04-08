#!/usr/bin/env node
'use strict';

const moduleName = __filename.replace(__dirname + '/', '').replace(/.js$/, ''); //this just seems to come in handy a lot

// const qt = require('qtools-functional-library'); //also exposes qtLog(); qt.help({printOutput:true, queryString:'.*', sendJson:false});

const os = require('os');
const path = require('path');
const fs = require('fs');

console.log(`HELLO FROM ${__dirname}/${moduleName}`);
//START OF moduleFunction() ============================================================
const moduleFunction = ({ moduleName } = {}) => ({ libraryName }) => {
	// ======================================================================================
	// SETTERS
	
	// --------------------------------------------------------------------------------
	// SET LIBRARY PATH
	
	let libraryPath;

	const setLibraryPath = (dirPath, callback) => {
		try {
			libraryPath = fs.realpathSync(dirPath);
		} catch (err) {
			callback(err.toString());
			return;
		}

		callback('', libraryPath);
	};

	// --------------------------------------------------------------------------------
	// SET CUSTOM MODULE ADDING FUNCTION

	const defaultAdd = (item, callback) => {
		require(item.endpointPath)(item.moduleArgs);
		callback();
	};
	
	let add = defaultAdd;
	
	const setCustomAddFunction = newFunction => (add = newFunction);
	
	
	// ======================================================================================
	// LOG LIST OBJECT
	
	const logList = (() => {
		const list = [];
		const push = item => list.push(item);
		const toString = () => {
			return list
				.reduce(
					(result, item) => `${result}${item}\n\t`,
					`\n${libraryName} Log\n\t`
				)
				.replace(/\n\t$/, '');
		};
		return { push, toString };
	})();
	
	
	// ======================================================================================
	// LIBRARY OBJECT

	const library = (() => {
		const list = {};
		const add = (name, item) => (list[name] = item);
		const toString = () => {
			return Object.keys(list)
				.reduce(
					(result, name) => `${result}${name}: ${(typeof(list[name])).match(/(string|number)/i)?list[name]:typeof(list[name])}\n\t`,
					`\n${libraryName} Library\n\t`
				)
				.replace(/\n\t$/, '');
		};
		return { add, toString };
	})();
	
	// ======================================================================================
	// LOAD MODULES (actual execution)

	const loadModules = ({ passThroughParameters }, callback) => {
		const asynchronousPipePlus = new require('qtools-asynchronous-pipe-plus')();
		const pipeRunner = asynchronousPipePlus.pipeRunner;
		const taskListPlus = asynchronousPipePlus.taskListPlus;

		const taskList = new taskListPlus();

		// --------------------------------------------------------------------------------
		// INTERNAL UTILITIES

		const mergeArgs = (args, next, propertyName) => (err, result) =>
			next(err, {
				...args,
				...(propertyName ? { [propertyName]: result } : result)
			});

		const forwardArgs = ({ next, args }) => err => next(err, args);

		// --------------------------------------------------------------------------------
		// INITIALIZE COMMON ADDED MODULE PARAMETERS

		const dotD = { logList, library };

		const moduleArgs = {
			dotD,
			passThroughParameters
		};

		// --------------------------------------------------------------------------------
		// BUILD TASKLIST

		taskList.push((args, next) => {
			const { libraryPath, passThroughParameters } = args;

			const localCallback = (err, result) => {
				next(err, { ...args, result });
			};

			fs
				.readdirSync(libraryPath)
				//.filter(file => path.extname(file) === '.js')
				.forEach(file => {
					// --------------------------------------------------------------------------------
					// TASKLIST ITEM TEMPLATE
					taskList.push((args, next) => {
						const { libraryPath, passThroughParameters } = args;

						const endpointPath = path.join(libraryPath, file);
						add(
							{
								endpointPath,
								moduleArgs
							},
							forwardArgs({ next, args })
						);
					});
				});
			localCallback('', args);
		});

		// --------------------------------------------------------------------------------
		// INIT AND EXECUTE THE PIPELINE

		const initialData = { libraryPath, passThroughParameters };
		pipeRunner(taskList.getList(), initialData, (err, args) => {
			const { libraryDotD } = args;

			callback(err);
		});
	};

	return {
		setLibraryPath,
		setCustomAddFunction,
		logList,
		library,
		loadModules
	};
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction({ moduleName });

