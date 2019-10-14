/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const fs = require('fs');
const fsPath = require('path');
const slash = require('slash');
const JSZip = require('jszip');
const xregexp = require('xregexp');
const languageTagRegex = require('ietf-language-tag-regex');
const DefaultArchiveLoader = require('./loaders/defaultarchiveloader');
const FileLoader = require('@accordproject/ergo-compiler').FileLoader;
const Logger = require('@accordproject/concerto-core').Logger;

// Matches 'sample.md' or 'sample_TAG.md' where TAG is an IETF language tag (BCP 47)
const IETF_REGEXP = languageTagRegex({ exact: false }).toString().slice(1,-2);
const SAMPLE_FILE_REGEXP = xregexp('sample(_(' + IETF_REGEXP + '))?.md$');

/**
 * A utility class to create templates from data sources.
 * @class
 * @private
 * @abstract
 */
class TemplateLoader extends FileLoader {
    /**
     * Create a template from an archive.
     * @param {*} Template - the type to construct
     * @param {Buffer} buffer  - the buffer to a Cicero Template Archive (cta) file
     * @param {object} options - additional options
     * @return {Promise<Template>} a Promise to the template
     */
    static async fromArchive(Template, buffer, options) {
        const method = 'fromArchive';
        const zip = await JSZip.loadAsync(buffer);
        // const allFiles = await TemplateLoader.loadZipFilesContents(zip, /.*/);
        // console.log(allFiles);
        const ctoModelFiles = [];
        const ctoModelFileNames = [];
        const sampleTextFiles = {};

        const readmeContents = await TemplateLoader.loadZipFileContents(zip, 'README.md');
        let sampleFiles = await TemplateLoader.loadZipFilesContents(zip, SAMPLE_FILE_REGEXP);
        sampleFiles.forEach( async (sampleFile) => {
            let matches = sampleFile.name.match(SAMPLE_FILE_REGEXP);
            let locale = 'default';
            // Locale match found
            if(matches !== null && matches[2]){
                locale = matches[2];
            }
            sampleTextFiles[locale] = sampleFile.contents;
        });

        const requestContents = await TemplateLoader.loadZipFileContents(zip, 'request.json', true);
        const packageJsonObject = await TemplateLoader.loadZipFileContents(zip, 'package.json', true, true);
        const templatizedGrammar = await TemplateLoader.loadZipFileContents(zip, 'grammar/template.tem', false, false);

        Logger.debug(method, 'Looking for model files');
        let ctoFiles =  await TemplateLoader.loadZipFilesContents(zip, /models[/\\].*\.cto$/);
        ctoFiles.forEach(async (file) => {
            ctoModelFileNames.push(file.name);
            ctoModelFiles.push(file.contents);
        });

        // create the template
        const template = new (Function.prototype.bind.call(Template, null, packageJsonObject, readmeContents, sampleTextFiles, requestContents, options));

        // add model files
        Logger.debug(method, 'Adding model files to model manager');
        template.getModelManager().addModelFiles(ctoModelFiles, ctoModelFileNames, true); // validation is disabled

        Logger.debug(method, 'Setting grammar');
        if(!templatizedGrammar) {
            throw new Error('A template must contain a template.tem file.');
        } else {
            template.parserManager.buildGrammar(templatizedGrammar);
        }

        // load and add the ergo files
        if(template.getMetadata().getErgoVersion()) {
            template.getLogicManager().addTemplateFile(templatizedGrammar,'grammar/template.tem');
            Logger.debug(method, 'Adding Ergo files to script manager');
            const scriptFiles = await TemplateLoader.loadZipFilesContents(zip, /lib[/\\].*\.ergo$/);
            scriptFiles.forEach(function (obj) {
                template.getLogicManager().addLogicFile(obj.contents, obj.name);
            });
        }

        // load and add compiled JS files - we assume all runtimes are JS based (review!)
        if(template.getMetadata().getRuntime()) {
            Logger.debug(method, 'Adding JS files to script manager');
            const scriptFiles = await TemplateLoader.loadZipFilesContents(zip, /lib[/\\].*\.js$/);
            scriptFiles.forEach(function (obj) {
                template.getLogicManager().addLogicFile(obj.contents, obj.name);
            });
        }

        // check the integrity of the model and logic of the template
        template.validate();

        return template; // Returns template
    }

    /**
     * Create a template from an URL.
     * @param {*} Template - the type to construct
     * @param {String} url  - the URL to a Cicero Template Archive (cta) file
     * @param {object} options - additional options
     * @return {Promise} a Promise to the template
     */
    static async fromUrl(Template, url, options) {
        const loader = new DefaultArchiveLoader();
        const buffer = await loader.load(url, options);
        return TemplateLoader.fromArchive(Template, buffer, options);
    }

    /**
     * Builds a Template from the contents of a directory.
     * The directory must include a package.json in the root (used to specify
     * the name, version and description of the template).
     *
     * @param {*} Template - the type to construct
     * @param {String} path to a local directory
     * @param {Object} [options] - an optional set of options to configure the instance.
     * @return {Promise<Template>} a Promise to the instantiated template
     */
    static async fromDirectory(Template, path, options) {
        if (!options) {
            options = {};
        }
        const method = 'fromDirectory';

        // grab the README.md
        const readmeContents = await TemplateLoader.loadFileContents(path, 'README.md');

        // grab the request.json
        const requestJsonObject = await TemplateLoader.loadFileContents(path, 'request.json', true );

        // grab the package.json
        const packageJsonObject = await TemplateLoader.loadFileContents(path, 'package.json', true, true );

        // grab the sample files
        Logger.debug(method, 'Looking for sample files');
        const sampleFiles = await TemplateLoader.loadFilesContents(path, SAMPLE_FILE_REGEXP);
        const sampleTextFiles = {};

        sampleFiles.forEach((file) => {
            const matches = file.name.match(SAMPLE_FILE_REGEXP);

            let locale = 'default';
            // Match found
            if(matches !== null && matches[2]){
                locale = matches[2];
            }
            Logger.debug(method, 'Using sample file locale', locale);
            sampleTextFiles[locale] = file.contents;
        });

        // create the template
        const template = new (Function.prototype.bind.call(Template, null, packageJsonObject, readmeContents, sampleTextFiles, requestJsonObject, options));
        const modelFiles = [];
        const modelFileNames = [];
        const ctoFiles = await TemplateLoader.loadFilesContents(path, /models[/\\].*\.cto$/);
        ctoFiles.forEach((file) => {
            modelFileNames.push(slash(file.name));
            modelFiles.push(file.contents);
        });

        template.getModelManager().addModelFiles(modelFiles, modelFileNames, true);
        if(!options.skipUpdateExternalModels){
            await template.getModelManager().updateExternalModels();
            Logger.debug(method, 'Added model files', modelFiles.length);

            const externalModelFiles = template.getModelManager().getModels();
            externalModelFiles.forEach(function (file) {
                fs.writeFileSync(path + '/models/' + file.name, file.content);
            });
        }


        // load and add the template
        let templatizedGrammar = await TemplateLoader.loadFileContents(path, 'grammar/template.tem', false, false);

        if(!templatizedGrammar) {
            throw new Error('A template must either contain a template.tem file.');
        } else {
            template.parserManager.buildGrammar(templatizedGrammar);
            Logger.debug(method, 'Loaded template.tem', templatizedGrammar);
        }

        Logger.debug(method, 'Loaded template.tem');

        // load and add the ergo files
        if(template.getMetadata().getErgoVersion() && template.getMetadata().getRuntime() === 'ergo') {
            // If Ergo then also register the template
            template.getLogicManager().addTemplateFile(templatizedGrammar,'grammar/template.tem');
            const ergoFiles = await TemplateLoader.loadFilesContents(path, /lib[/\\].*\.ergo$/);
            ergoFiles.forEach((file) => {
                const resolvedPath = slash(fsPath.resolve(path));
                const resolvedFilePath = slash(fsPath.resolve(file.name));
                const truncatedPath = resolvedFilePath.replace(resolvedPath+'/', '');
                template.getLogicManager().addLogicFile(file.contents, truncatedPath);
            });
        }

        // load and add compiled JS files - we assume all runtimes are JS based (review!)
        if(template.getMetadata().getRuntime() !== 'ergo') {
            const jsFiles = await TemplateLoader.loadFilesContents(path, /lib[/\\].*\.js$/);
            jsFiles.forEach((file) => {
                const resolvedPath = slash(fsPath.resolve(path));
                const resolvedFilePath = slash(fsPath.resolve(file.name));
                const truncatedPath = resolvedFilePath.replace(resolvedPath+'/', '');
                template.getLogicManager().addLogicFile(file.contents, truncatedPath);
            });
        }

        // check the template
        template.validate();

        return template;
    }

    /**
     * Prepare the text for parsing (normalizes new lines, etc)
     * @param {string} input - the text for the clause
     * @return {string} - the normalized text for the clause
     */
    static normalizeText(input) {
        // we replace all \r and \n with \n
        let text =  input.replace(/\r/gm,'');
        return text;
    }

}

module.exports = TemplateLoader;