import { MeiliSearch } from 'meilisearch';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST,
    apiKey: process.env.MEILISEARCH_API_KEY,
});



async function analyzeContent(hit, keyword, prompt) {
    try {
        // Get first 2000 chars and extend to the next period to complete the sentence
        let contentToAnalyze = hit.content.slice(0, 2000);
        const nextPeriod = hit.content.indexOf('.', 2000);
        if (nextPeriod !== -1 && nextPeriod < 2200) { // Allow up to 200 extra chars to complete sentence
            contentToAnalyze = hit.content.slice(0, nextPeriod + 1);
        }

        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a technical documentation assistant. Provide ONLY a valid JSON object in this format: {\"score\": <number between 0-10 with up to 2 decimal places>, \"relevantContent\": \"<provide a direct, factual summary that answers the user's prompt. Focus on technical details and definitions. Avoid phrases like 'The content includes' or 'This section describes'. Keep the summary concise, within 100 words.>\"}"

//                         `You are a technical documentation assistant. 
// Provide ONLY a valid JSON object in this format: 
// {
//   "score": <number between 0-10 with up to 2 decimal places>,
//   "relevantContent": "<provide a direct, factual summary that answers the user's prompt. Focus on technical details and definitions. Avoid phrases like 'The content includes' or 'This section describes'. Keep the summary concise, within 100 words.>"
// }
// Ensure the "score" field is a decimal number with a maximum of 2 digits after the decimal point.`
                },
                {
                    role: "user",
                    content: `Analyze this content for relevance to the keyword "${keyword}" and prompt "${prompt}". Content: ${contentToAnalyze}`
                }
            ],
            model: "llama3-8b-8192",
            temperature: 0.1, // Lower temperature for more consistent JSON output
        });

        let analysis;
        const responseText = response.choices[0]?.message?.content?.trim() || '';

        // Extract JSON if it's wrapped in other text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                analysis = JSON.parse(jsonMatch[0]);
                // Validate the required fields
                if (typeof analysis.score !== 'number' || typeof analysis.relevantContent !== 'string') {
                    throw new Error('Invalid JSON structure');
                }
            } catch (parseError) {
                console.error('JSON parsing error:', parseError, 'Response:', responseText);
                throw new Error('Failed to parse LLM response as valid JSON');
            }
        } else {
            throw new Error('No valid JSON found in response');
        }

        const result = {
            id: hit.id,
            url: hit.url,
            title: hit.title,
            score: analysis.score || 0,
            relevantContent: analysis.relevantContent || 'No relevant content found.'
        };
        console.log(result);
        console.log('================================================================');

        return result;
    } catch (error) {
        console.error('Content analysis error:', error);
        return {
            id: hit.id,
            url: hit.url,
            title: hit.title,
            score: 0,
            relevantContent: 'Analysis failed.'
        };
    }
}



/**
 * Analyze the content of each search result and score it using the Llama model.
 * @param {Object} hit - A single search result object containing title, content, etc.
 * @param {string} keyword - The keyword used in the search query.
 * @param {string} prompt - The original user prompt.
 * @returns {Promise<Object>} - An object containing the result with its score and relevant content.
 */



/**
 * Search for keyword in the Meilisearch index, analyze results using Llama, and return the top 3 scored results.
 * @param {string} websiteName - The name of the Meilisearch index.
 * @param {string} keyword - The keyword to search in the index.
 * @param {string} prompt - The original user prompt.
 * @returns {Promise<Array>} - The top 3 results with scores and relevant content.
 */


export async function searchInIndex(websiteName, keyword, prompt) {
    try {
        const index = client.index(websiteName);
        const searchResults = await index.search(keyword, {
            limit: 20,
            attributesToRetrieve: ['id', 'url', 'title', 'content']
        });

        if (!searchResults.hits.length) {
            return [];
        }
        console.log(searchResults);
        console.log("------------------------------------Further processing-------------------------------------------")
        const analyzedResults = await Promise.all(
            searchResults.hits.map(hit => analyzeContent(hit, keyword, prompt))
        );

        // Sort by score and return top 3
        return analyzedResults
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        return searchResults;
    } catch (error) {
        console.error('Meilisearch query error:', error);
        throw error;
    }
}