const { Octokit } = require("@octokit/rest");
require('dotenv').config();

const TOKEN = process.env.token;

if (!TOKEN) {
  throw new Error("GitHub token not found in environment variables.");
}

const octokit = new Octokit({ auth: TOKEN });

const owner = "suu-b";  
const repo = "super-duper-disco";     

const pushToGitHub = async (path, message, content) => {
    const contentEncoded = Buffer.from(content).toString("base64");
    try{
        await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,   
            path,
            message,
            content: contentEncoded,    
        });
        console.log("File pushed to GitHub successfully.");
    }
    catch(error){  
        console.error("Error pushing file to GitHub:", error);
    }
}

module.exports = pushToGitHub;
