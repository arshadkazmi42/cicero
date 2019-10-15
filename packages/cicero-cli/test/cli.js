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

const chai = require('chai');
const path = require('path');
const tmp = require('tmp-promise');
const fs = require('fs');
const should = require('chai').should();

const Template = require('@accordproject/cicero-core').Template;

chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

const Commands = require('../lib/commands');

const template = path.resolve(__dirname, 'data/latedeliveryandpenalty/');
const templateJs = path.resolve(__dirname, 'data/latedeliveryandpenalty_js/');
const templateArchive = path.resolve(__dirname, 'data/latedeliveryandpenalty.cta');
const sample = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'sample.md');
const data = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'data.json');
const request = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'request.json');
const state = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'state.json');
const dataOut = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'data_out.json');
const sampleOut = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'sample_out.md');
const parseReponse = {
    '$class':'org.accordproject.latedeliveryandpenalty.TemplateModel',
    'forceMajeure':true,
    'penaltyDuration':{
        '$class':'org.accordproject.time.Duration',
        'amount':9,
        'unit':'days'
    },
    'penaltyPercentage':7,
    'capPercentage':2,
    'termination':{
        '$class':'org.accordproject.time.Duration',
        'amount':2,
        'unit':'weeks'
    },
    'fractionalPart':'days'
};
const draftResponse = 'Late Delivery and Penalty. In case of delayed delivery except for Force Majeure cases, the Seller shall pay to the Buyer for every 9 days of delay penalty amounting to 7.0% of the total value of the Equipment whose delivery has been delayed. Any fractional part of a days is to be considered a full days. The total amount of penalty shall not however, exceed 2.0% of the total value of the Equipment involved in late delivery. If the delay is more than 2 weeks, the Buyer is entitled to terminate this Contract.';

const sampleErr = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'sample_err.md');
const dataErr = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'data_err.json');
const stateErr = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'state_err.json');
const requestErr = path.resolve(__dirname, 'data/latedeliveryandpenalty/', 'request_err.json');

describe('#validateParseArgs', () => {
    it('no args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateParseArgs({
            _: ['parse'],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateParseArgs({
            _: ['parse'],
            template: './',
            sample: 'sample.md'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, parent folder', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateParseArgs({
            _: ['parse'],
            template: 'latedeliveryandpenalty',
            sample: 'latedeliveryandpenalty/sample.md'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, archive', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateParseArgs({
            _: ['parse'],
            template: 'latedeliveryandpenalty.cta',
            sample: 'latedeliveryandpenalty/sample.md'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty.cta$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, parent folder, no sample', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateParseArgs({
            _: ['parse'],
            template: 'latedeliveryandpenalty',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, child folder, no sample', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/grammar'));
        const args  = Commands.validateParseArgs({
            _: ['parse'],
            template: '../',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('no flags specified', () => {
        const args  = Commands.validateParseArgs({
            _: ['parse', path.resolve(__dirname, 'data/latedeliveryandpenalty/')],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('verbose flag specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        Commands.validateParseArgs({
            _: ['parse'],
            verbose: true
        });
    });
    it('bad package.json', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        (() => Commands.validateParseArgs({
            _: ['parse'],
        })).should.throw(' not a valid cicero template. Make sure that package.json exists and that it has a cicero entry.');
    });
    it('bad sample.md', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        (() => Commands.validateParseArgs({
            _: ['parse'],
            sample: 'sample_en.md'
        })).should.throw('A sample.md file is required. Try the --sample flag or create a sample.md in the root folder of your template.');
    });
});

describe('#parse', () => {
    it('should parse a clause using a template', async () => {
        const result = await Commands.parse(template, sample, null);
        delete result.clauseId;
        result.should.eql(parseReponse);
    });

    it('should parse a clause using a template archive', async () => {
        const result = await Commands.parse(templateArchive, sample, null);
        delete result.clauseId;
        result.should.eql(parseReponse);
    });

    it('should fail parsing a clause using a template', async () => {
        const result = await Commands.parse(template, sampleErr, null);
        should.equal(result,undefined);
    });
});

describe('#parse-output', async () => {
    it('should parse a clause using a template and save to a JSON file', async () => {
        const result = await Commands.parse(template, sample, dataOut);
        delete result.clauseId;
        result.should.eql(parseReponse);
    });
});

describe('#validateDraftArgs', () => {
    it('no args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateDraftArgs({
            _: ['draft'],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.data.should.match(/data.json$/);
    });
    it('all args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateDraftArgs({
            _: ['draft'],
            template: './',
            data: 'data.json'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.data.should.match(/data.json$/);
    });
    it('all args specified, parent folder', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateDraftArgs({
            _: ['draft'],
            template: 'latedeliveryandpenalty',
            data: 'latedeliveryandpenalty/data.json'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.data.should.match(/data.json$/);
    });
    it('all args specified, archive', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateDraftArgs({
            _: ['draft'],
            template: 'latedeliveryandpenalty.cta',
            data: 'latedeliveryandpenalty/data.json'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty.cta$/);
        args.data.should.match(/data.json$/);
    });
    it('all args specified, parent folder, no sample', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateDraftArgs({
            _: ['draft'],
            template: 'latedeliveryandpenalty',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.data.should.match(/data.json$/);
    });
    it('all args specified, child folder, no sample', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/grammar'));
        const args  = Commands.validateDraftArgs({
            _: ['draft'],
            template: '../',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.data.should.match(/data.json$/);
    });
    it('no flags specified', () => {
        const args  = Commands.validateDraftArgs({
            _: ['draft', path.resolve(__dirname, 'data/latedeliveryandpenalty/')],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.data.should.match(/data.json$/);
    });
    it('verbose flag specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        Commands.validateDraftArgs({
            _: ['draft'],
            verbose: true
        });
    });
    it('bad package.json', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        (() => Commands.validateDraftArgs({
            _: ['draft'],
        })).should.throw(' not a valid cicero template. Make sure that package.json exists and that it has a cicero entry.');
    });
    it('bad data.json', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        (() => Commands.validateDraftArgs({
            _: ['draft'],
            data: 'data_en.json'
        })).should.throw('A data.json file is required. Try the --data flag or create a data.json in the root folder of your template.');
    });
});

describe('#draft', () => {
    it('should create the text for a clause using a template', async () => {
        const result = await Commands.draft(template, data, null);
        delete result.clauseId;
        result.should.eql(draftResponse);
    });

    it('should create the text for a clause using a template archive', async () => {
        const result = await Commands.draft(templateArchive, data, null);
        delete result.clauseId;
        result.should.eql(draftResponse);
    });

    it('should fail generating the text for a clause using a template', async () => {
        const result = await Commands.draft(template, dataErr, null);
        should.equal(result,undefined);
    });
});

describe('#draft-output', async () => {
    it('should create the text for a clause using a template and save to a JSON file', async () => {
        const result = await Commands.draft(template, data, sampleOut);
        delete result.clauseId;
        result.should.eql(draftResponse);
    });
});

describe('#validateRedraftArgs', () => {
    it('no args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateRedraftArgs({
            _: ['redraft'],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateRedraftArgs({
            _: ['redraft'],
            template: './',
            sample: 'sample.md'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, parent folder', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateRedraftArgs({
            _: ['redraft'],
            template: 'latedeliveryandpenalty',
            sample: 'latedeliveryandpenalty/sample.md'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, archive', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateRedraftArgs({
            _: ['redraft'],
            template: 'latedeliveryandpenalty.cta',
            sample: 'latedeliveryandpenalty/sample.md'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty.cta$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, parent folder, no sample', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateRedraftArgs({
            _: ['redraft'],
            template: 'latedeliveryandpenalty',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, child folder, no sample', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/grammar'));
        const args  = Commands.validateRedraftArgs({
            _: ['redraft'],
            template: '../',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('no flags specified', () => {
        const args  = Commands.validateRedraftArgs({
            _: ['redraft', path.resolve(__dirname, 'data/latedeliveryandpenalty/')],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('verbose flag specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        Commands.validateRedraftArgs({
            _: ['redraft'],
            verbose: true
        });
    });
    it('bad package.json', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        (() => Commands.validateRedraftArgs({
            _: ['redraft'],
        })).should.throw(' not a valid cicero template. Make sure that package.json exists and that it has a cicero entry.');
    });
    it('bad sample.md', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        (() => Commands.validateRedraftArgs({
            _: ['redraft'],
            sample: 'sample_en.md'
        })).should.throw('A sample.md file is required. Try the --sample flag or create a sample.md in the root folder of your template.');
    });
    it('output specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateRedraftArgs({
            _: ['redraft'],
            output: sampleOut,
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.output.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty[/\\]sample_out.md$/);
        args.sample.should.match(/sample.md$/);
    });
    it('overwrite specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateRedraftArgs({
            _: ['redraft'],
            overwrite: true,
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.output.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty[/\\]sample.md$/);
        args.sample.should.match(/sample.md$/);
    });
    it('both output and overwrite specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        (() => Commands.validateRedraftArgs({
            _: ['redraft'],
            output: sampleOut,
            overwrite: true,
        })).should.throw('Cannot use both --overwrite and --output');
    });
});

describe('#redraft', () => {
    it('should redraft a clause using a template', async () => {
        const result = await Commands.redraft(template, sample, false, null);
        delete result.clauseId;
        result.should.eql(draftResponse);
    });

    it('should redraft a clause using a template archive', async () => {
        const result = await Commands.redraft(templateArchive, sample, false, null);
        delete result.clauseId;
        result.should.eql(draftResponse);
    });

    it('should fail redrafting a clause using a template', async () => {
        const result = await Commands.redraft(template, sampleErr, false, null);
        should.equal(result,undefined);
    });
});

describe('#redraft-output', async () => {
    it('should parse a clause using a template and save to a JSON file', async () => {
        const result = await Commands.redraft(template, sample, false, dataOut);
        result.should.eql(draftResponse);
    });
});

describe('#validateExecuteArgs', () => {
    it('no args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateExecuteArgs({
            _: ['execute'],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateExecuteArgs({
            _: ['execute'],
            template: './',
            sample: 'sample.md',
            state: 'state.json'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, parent folder', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateExecuteArgs({
            _: ['execute'],
            template: 'latedeliveryandpenalty',
            sample: 'latedeliveryandpenalty/sample.md',
            state: 'latedeliveryandpenalty/state.json'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, parent folder, no sample, no state', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateExecuteArgs({
            _: ['execute'],
            template: 'latedeliveryandpenalty',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, child folder, no sample', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/grammar'));
        const args  = Commands.validateExecuteArgs({
            _: ['execute'],
            template: '../',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('no flags specified', () => {
        const args  = Commands.validateExecuteArgs({
            _: ['execute', path.resolve(__dirname, 'data/latedeliveryandpenalty/')],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('verbose flag specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        Commands.validateExecuteArgs({
            _: ['execute'],
            verbose: true
        });
    });
    it('bad package.json', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        (() => Commands.validateExecuteArgs({
            _: ['execute'],
        })).should.throw(' not a valid cicero template. Make sure that package.json exists and that it has a cicero entry.');
    });
    it('bad sample.md', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        (() => Commands.validateExecuteArgs({
            _: ['execute'],
            sample: 'sample_en.md'
        })).should.throw('A sample.md file is required. Try the --sample flag or create a sample.md in the root folder of your template.');
    });
    it('bad requestjson', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        (() => Commands.validateExecuteArgs({
            _: ['execute'],
            request: ['request1.json']
        })).should.throw('A request.json file is required. Try the --request flag or create a request.json in the root folder of your template.');
    });
});

describe('#execute', () => {
    it('should execute a clause using a template', async () => {
        const response = await Commands.execute(template, sample, [request], state);
        response.response.$class.should.be.equal('org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse');
        response.response.penalty.should.be.equal(4);
        response.response.buyerMayTerminate.should.be.equal(true);
    });

    it('should execute a clause using a template archive', async () => {
        const response = await Commands.execute(templateArchive, sample, [request], state);
        response.response.$class.should.be.equal('org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse');
        response.response.penalty.should.be.equal(4);
        response.response.buyerMayTerminate.should.be.equal(true);
    });

    it('should execute with default state when state is not found', async () => {
        const response = await Commands.execute(template, sample, [request], stateErr);
        response.response.$class.should.be.equal('org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse');
        response.response.penalty.should.be.equal(4);
        response.response.buyerMayTerminate.should.be.equal(true);
    });

    it('should execute with more than one request', async () => {
        const response = await Commands.execute(template, sample, [request,request], state);
        response.response.$class.should.be.equal('org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse');
        response.response.penalty.should.be.equal(4);
        response.response.buyerMayTerminate.should.be.equal(true);
    });

    it('should fail execute on a bogus request', async () => {
        const response = await Commands.execute(template, sample, [requestErr], state);
        should.equal(response,undefined);
    });

    it('should execute a clause using a template (with currentTime set)', async () => {
        const response = await Commands.execute(template, sample, [request], state, '2017-12-19T17:38:01Z');
        response.response.$class.should.be.equal('org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse');
        response.response.penalty.should.be.equal(3.1111111111111107);
        response.response.buyerMayTerminate.should.be.equal(false);
    });
});

describe('#execute-ergo', () => {
    it('should execute a clause in ergo using a template', async () => {
        const response = await Commands.execute(template, sample, [request], state);
        response.response.$class.should.be.equal('org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse');
        response.response.penalty.should.be.equal(4);
        response.response.buyerMayTerminate.should.be.equal(true);
    });
});

describe('#execute-javascript', () => {
    it('should execute a clause in ergo using a template', async () => {
        const response = await Commands.execute(templateJs, sample, [request], state);
        response.response.$class.should.be.equal('org.accordproject.latedeliveryandpenalty.LateDeliveryAndPenaltyResponse');
        response.response.penalty.should.be.equal(4);
        response.response.buyerMayTerminate.should.be.equal(true);
    });
});

describe('#validateInitializeArgs', () => {
    it('no args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateInitializeArgs({
            _: ['initialize'],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateInitializeArgs({
            _: ['initialize'],
            template: './',
            sample: 'sample.md'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, parent folder', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateInitializeArgs({
            _: ['initt'],
            template: 'latedeliveryandpenalty',
            sample: 'latedeliveryandpenalty/sample.md'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, parent folder, no sample, no state', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        const args  = Commands.validateInitializeArgs({
            _: ['initialize'],
            template: 'latedeliveryandpenalty',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('all args specified, child folder, no sample', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/grammar'));
        const args  = Commands.validateInitializeArgs({
            _: ['initialize'],
            template: '../',
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('no flags specified', () => {
        const args  = Commands.validateInitializeArgs({
            _: ['initialize', path.resolve(__dirname, 'data/latedeliveryandpenalty/')],
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.sample.should.match(/sample.md$/);
    });
    it('verbose flag specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        Commands.validateInitializeArgs({
            _: ['initialize'],
            verbose: true
        });
    });
    it('bad package.json', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        (() => Commands.validateInitializeArgs({
            _: ['initialize'],
        })).should.throw(' not a valid cicero template. Make sure that package.json exists and that it has a cicero entry.');
    });
    it('bad sample.md', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        (() => Commands.validateInitializeArgs({
            _: ['initialize'],
            sample: 'sample_en.md'
        })).should.throw('A sample.md file is required. Try the --sample flag or create a sample.md in the root folder of your template.');
    });
});

describe('#initialize', () => {
    it('should initialize a clause using a template', async () => {
        const response = await Commands.initialize(template, sample);
        response.state.$class.should.be.equal('org.accordproject.cicero.contract.AccordContractState');
        response.state.stateId.should.be.equal('org.accordproject.cicero.contract.AccordContractState#1');
    });

    it('should initialize a clause using a template archive', async () => {
        const response = await Commands.initialize(templateArchive, sample);
        response.state.$class.should.be.equal('org.accordproject.cicero.contract.AccordContractState');
        response.state.stateId.should.be.equal('org.accordproject.cicero.contract.AccordContractState#1');
    });

    it('should fail to initialize on a bogus sample', async () => {
        const response = await Commands.initialize(template, sampleErr);
        should.equal(response,undefined);
    });
});

describe('#compile', () => {

    it('should compile to a Go model', async () => {
        const dir = await tmp.dir({ unsafeCleanup: true});
        await Commands.compile(template, 'Go', dir.path, true);
        fs.readdirSync(dir.path).length.should.be.above(0);
        dir.cleanup();
    });
    it('should compile to a PlantUML model', async () => {
        const dir = await tmp.dir({ unsafeCleanup: true});
        await Commands.compile(template, 'PlantUML', dir.path, true);
        fs.readdirSync(dir.path).length.should.be.above(0);
        dir.cleanup();
    });
    it('should compile to a Typescript model', async () => {
        const dir = await tmp.dir({ unsafeCleanup: true});
        await Commands.compile(template, 'Typescript', dir.path, true);
        fs.readdirSync(dir.path).length.should.be.above(0);
        dir.cleanup();
    });
    it('should compile to a Java model', async () => {
        const dir = await tmp.dir({ unsafeCleanup: true});
        await Commands.compile(template, 'Java', dir.path, true);
        fs.readdirSync(dir.path).length.should.be.above(0);
        dir.cleanup();
    });
    it('should compile to a Corda model', async () => {
        const dir = await tmp.dir({ unsafeCleanup: true});
        await Commands.compile(template, 'Corda', dir.path, true);
        fs.readdirSync(dir.path).length.should.be.above(0);
        dir.cleanup();
    });
    it('should compile to a JSONSchema model', async () => {
        const dir = await tmp.dir({ unsafeCleanup: true});
        await Commands.compile(template, 'JSONSchema', dir.path, true);
        fs.readdirSync(dir.path).length.should.be.above(0);
        dir.cleanup();
    });
    it('should not compile to an unknown model', async () => {
        const dir = await tmp.dir({ unsafeCleanup: true});
        await Commands.compile(template, 'BLAH', dir.path, true);
        fs.readdirSync(dir.path).length.should.be.equal(0);
        dir.cleanup();
    });
});

describe('#validateArchiveArgs', () => {
    it('no args specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateArchiveArgs({
            _: ['archive']
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.target.should.match(/ergo/);
    });
    it('only target arg specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        const args  = Commands.validateArchiveArgs({
            _: ['archive'],
            target: 'ergo'
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.target.should.match(/ergo/);
    });
    it('template arg specified', () => {
        process.chdir(path.resolve(__dirname));
        const args  = Commands.validateArchiveArgs({
            _: ['archive', 'data/latedeliveryandpenalty/']
        });
        args.template.should.match(/cicero-cli[/\\]test[/\\]data[/\\]latedeliveryandpenalty$/);
        args.target.should.match(/ergo/);
    });
    it('verbose flag specified', () => {
        process.chdir(path.resolve(__dirname, 'data/latedeliveryandpenalty/'));
        Commands.validateArchiveArgs({
            _: ['archive'],
            verbose: true
        });
    });
    it('bad package.json', () => {
        process.chdir(path.resolve(__dirname, 'data/'));
        (() => Commands.validateArchiveArgs({
            _: ['execute']
        })).should.throw(' not a valid cicero template. Make sure that package.json exists and that it has a cicero entry.');
    });
});

describe('#archive', async () => {
    it('should create a valid ergo archive', async () => {
        const archiveName = 'test.cta';
        const result = await Commands.archive(template, 'ergo', archiveName);
        result.should.eql(true);
        const newTemplate = await Template.fromArchive(fs.readFileSync(archiveName));
        newTemplate.should.not.be.null;
        newTemplate.hasLogic().should.equal(true);
        fs.unlinkSync(archiveName);
    });

    it('should create a valid ergo archive with a default name', async () => {
        const archiveName = 'latedeliveryandpenalty@0.0.1.cta';
        const result = await Commands.archive(template, 'ergo', null);
        result.should.eql(true);
        const newTemplate = await Template.fromArchive(fs.readFileSync(archiveName));
        newTemplate.should.not.be.null;
        newTemplate.hasLogic().should.equal(true);
        fs.unlinkSync(archiveName);
    });

    it('should create an Ergo archive', async () => {
        const tmpFile = await tmp.file();
        const tmpArchive = tmpFile.path + '.cta';
        await Commands.archive(template, 'ergo', tmpArchive, false);
        fs.readFileSync(tmpArchive).length.should.be.above(0);
        tmpFile.cleanup();
    });
    it('should create a JavaScript archive', async () => {
        const tmpFile = await tmp.file();
        const tmpArchive = tmpFile.path + '.cta';
        await Commands.archive(template, 'cicero', tmpArchive, false);
        fs.readFileSync(tmpArchive).length.should.be.above(0);
        tmpFile.cleanup();
    });
    it('should not create an unknown archive', async () => {
        const tmpFile = await tmp.file();
        const tmpArchive = tmpFile.path + '.cta';
        return Commands.archive(template, 'foo', tmpArchive, false)
            .should.be.rejectedWith('Unknown target: foo (available: es5,es6,cicero,java)');
    });
});

