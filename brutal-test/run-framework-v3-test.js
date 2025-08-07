#!/usr/bin/env node

/**
 * Run BRUTAL tests on Framework V3
 */

import { BrutalTestSystem } from './index.js';

async function run() {
    console.log(`
██████╗ ██████╗ ██╗   ██╗████████╗ █████╗ ██╗     
██╔══██╗██╔══██╗██║   ██║╚══██╔══╝██╔══██╗██║     
██████╔╝██████╔╝██║   ██║   ██║   ███████║██║     
██╔══██╗██╔══██╗██║   ██║   ██║   ██╔══██║██║     
██████╔╝██║  ██║╚██████╔╝   ██║   ██║  ██║███████╗
╚═════╝ ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝
         Framework V3 Test - Zero Mercy Mode        
`);

    try {
        const options = {
            frameworkPath: './framework-v3',
            fix: process.argv.includes('--fix'),
            headless: !process.argv.includes('--no-headless')
        };
        
        console.log('Options:', options);
        console.log('');
        
        const results = await BrutalTestSystem.testFrameworkV3(options);
        
        process.exit(results.errors?.length > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

run();