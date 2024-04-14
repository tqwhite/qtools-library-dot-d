#!/usr/bin/env node
'use strict';

const moduleName = __filename.replace(__dirname + '/', '').replace(/.js$/, ''); //this just seems to come in handy a lot

// const qt = require('qtools-functional-library'); //also exposes qtLog(); qt.help({printOutput:true, queryString:'.*', sendJson:false});

const os = require('os');
const path = require('path');
const fs = require('fs');

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
		const formatList = () => {
			return list
				.reduce(
					(result, item) => `${result}${item}\n\t`,
					`\n${libraryName} Log\n\t`
				)
				.replace(/\n\t$/, '');
		};
		return { push, formatList };
	})();

	// ======================================================================================
	// LIBRARY OBJECT

	const libraryObject = {}; //used only for producing display listings
	const library = (() => {
		const add = (name, item) => {
			libraryObject[name] = item; //used only for producing display listings
			externalElements[name] = item;
		};
		return { add };
	})();

	// ======================================================================================
	// LIBRARY OBJECT

	const toString = () => {
	
	const formatProperty=item=>{
		let outString=typeof(item);
	 if (typeof(item)=='function'){
	 	const result=item.toString().match(/\((?<args>.*?\))/);
	 	outString=`(${result.qtGetSurePath('groups.args', 'function')})`

	 }
	return outString;
	}
	
		return Object.keys(libraryObject)
			.reduce(
				(result, name) =>
					`${result}${name}: ${
						(typeof libraryObject[name]).match(/(string|number)/i)
							? libraryObject[name]
							: formatProperty(libraryObject[name])
					}\n\t`,
				`\n${libraryName} Library\n\t`
			)
			.replace(/\n\t$/, '');
	};

	// ======================================================================================
	// SEAL OBJECT (make immutable)

	const sealActual = externalElements => () => {
		Object.assign(
			externalElements.library.qtSelectProperties(['add'], {
				excludeMode: true
			})
		);
		Object.assign(
			externalElements.logList.qtSelectProperties(['push'], {
				excludeMode: true
			})
		);

		Object.assign(
			externalElements.qtSelectProperties(
				[
					'setLibraryPath',
					'loadModules',
					'seal',
					'setCustomAddFunction',
					'library',
					'logList'
				],
				{ excludeMode: true }
			)
		);
		Object.freeze(externalElements);
		Object.seal(externalElements);
	};

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

	const externalElements = {
		setLibraryPath,
		setCustomAddFunction,
		logList,
		library,
		loadModules,
		toString,
		qtdProcessLog: logList.formatList
	};
	externalElements.seal = sealActual(externalElements);
	return externalElements;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction({ moduleName });

