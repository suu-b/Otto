const { Octokit } = require("@octokit/rest");

const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  throw new Error("GitHub token not found in environment variables.");
}

const octokit = new Octokit({ auth: TOKEN });

const owner = "suu-b";  
const repo = "Preface";     

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
        return true;
    }
    catch(error){  
        console.error("Error pushing file to GitHub:", error);
        throw error;
    }
}

const readFileFromGitHub = async (path) => {
    try{
        const { data } = await octokit.repos.getContent({
            owner, repo, path
        });
        
        if (data.content) {
            const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
            return decodedContent;
        }
        return data;
    }
    catch(error){
        // If file doesn't exist (404) or any other error, return empty string
        if (error.status === 404) {
            console.log(`File ${path} not found, returning empty string`);
            return "";
        }
        console.error("Some error occurred:", error);
        return ""; // Return empty string for any other errors too
    }
} 

const updateOnGitHub = async (path, message, content) => {
    const contentEncoded = Buffer.from(content).toString("base64");
    try {
        let sha = null;
        
        try {
            const { data: currentFile } = await octokit.repos.getContent({
                owner,
                repo,
                path
            });
            sha = currentFile.sha;
        } catch (error) {
            if (error.status === 404) {
                console.log(`File ${path} doesn't exist, will create new one with headers`);
                sha = null;
            } else {
                throw error;
            }
        }
        
        let finalContent = content;
        if (!sha) {
            const headers = "date,title,description";
            finalContent = headers + content;
            const finalContentEncoded = Buffer.from(finalContent).toString("base64");
            
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path,
                message,
                content: finalContentEncoded
            });
        } else {
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path,
                message,
                content: contentEncoded,
                sha: sha
            });
        }
        
        console.log("File updated on GitHub successfully.");
        return true;
    }
    catch (error){
        console.error("Error updating on github", error);
        throw error;
    }
}

module.exports = { pushToGitHub, updateOnGitHub, readFileFromGitHub };
