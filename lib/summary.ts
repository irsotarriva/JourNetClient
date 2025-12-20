import { db } from '@/lib/db';
import { HUGGING_FACE_API_KEY } from './server-db';

const HUGGING_FACE_API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn";

interface ScoredComment {
    text: string;
    score: number;
}

function calculateCommentScore(comment: any): number {
    const upVotes = comment.likes || 0;
    const downVotes = comment.dislikes || 0;
    return upVotes - downVotes;
}

function prepareWeightedCommentsText(comments: any[], paperAbstract: string): string {
    const scoredComments: ScoredComment[] = [];

    for (const comment of comments) {
        if (!comment.content) continue;

        const score = calculateCommentScore(comment);

        if (score >= 0) {
            scoredComments.push({
                text: comment.content,
                score: score
            });
        }
    }

    scoredComments.sort((a, b) => b.score - a.score);

    const textParts: string[] = [];

    if (paperAbstract) {
        textParts.push(`Paper Abstract: ${paperAbstract}`);
        textParts.push("");
    }

    textParts.push("Discussion Comments:");

    if (scoredComments.length === 0) {
        textParts.push(""); // Empty string when no comments
    } else {
        scoredComments.forEach((commentData, i) => {
            const idx = i + 1;
            const { score, text } = commentData;

            if (score >= 10) {
                textParts.push(`[High-rated comment ${idx}]: ${text}`);
                textParts.push(`[Important]: ${text}`);
                textParts.push(`[Highly upvoted]: ${text}`);
            } else if (score >= 5) {
                textParts.push(`[Well-received comment ${idx}]: ${text}`);
                textParts.push(`[Upvoted]: ${text}`);
            } else {
                textParts.push(`Comment ${idx}: ${text}`);
            }
        });
    }

    return textParts.join(" ");
}

async function generateSummaryWithHuggingFace(text: string): Promise<string> {
    if (!HUGGING_FACE_API_KEY) {
        throw new Error("Hugging Face API key not configured");
    }

    const response = await fetch(HUGGING_FACE_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            inputs: text,
            parameters: {
                max_length: 200,
                min_length: 50,
                do_sample: false
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API error (Status ${response.status}): ${errorText}`);
    }

    const result = await response.json();
    if (Array.isArray(result) && result.length > 0) {
        return result[0].summary_text || "";
    } else {
        throw new Error(`Unexpected API response format: ${JSON.stringify(result)}`);
    }
}

export async function generateSummaryForPaper(paperId: string): Promise<{ success: boolean; message: string; summary?: string }> {
    try {
        console.log(`generateSummaryForPaper called for ID: ${paperId}`);

        // 1. Get Paper Abstract
        const paper = await db.articles.findById(paperId);
        if (!paper) {
            console.log('Paper not found');
            return { success: false, message: "Paper not found" };
        }
        console.log(`Paper found: ${paper.title}, Abstract len: ${paper.abstract?.length}`);

        // 2. Get Comments
        const comments = await db.comments.findByArticleId(paperId);
        console.log(`Comments found: ${comments.length}`);

        // 3. Prepare Text
        let fullText = prepareWeightedCommentsText(comments, paper.abstract);
        console.log(`Prepared text length: ${fullText.length}`);

        const MAX_CHARS = 4000;
        if (fullText.length > MAX_CHARS) {
            fullText = fullText.substring(0, MAX_CHARS) + "...";
            console.log('Text truncated to 4000 chars');
        }

        // 4. Generate Summary
        console.log('Calling Hugging Face API...');

        if (!HUGGING_FACE_API_KEY) {
            console.error('API KEY MISSING IN FUNCTION');
        }

        const summary = await generateSummaryWithHuggingFace(fullText);
        console.log('Summary generated successfully');

        if (!summary) {
            return { success: false, message: "Summary generation returned empty result" };
        }

        // 5. Update Paper
        console.log('Updating paper in database...');
        const { supabase } = await import('./server-db');
        const { error } = await supabase
            .from('Papers')
            .update({ comments_summary: summary })
            .eq('id', paperId);

        if (error) {
            console.error('Database update error:', error);
            throw new Error(`Failed to update paper summary: ${error.message}`);
        }

        return { success: true, message: "Summary generated successfully", summary };

    } catch (error: any) {
        console.error("generateSummaryForPaper error:", error);
        return { success: false, message: error.message || "Failed to generate summary" };
    }
}
