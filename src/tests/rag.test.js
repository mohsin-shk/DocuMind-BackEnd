import { askQuestion } from "../services/rag.service.js";

const TEST_OWNER_ID = "6a13fa45e5a93876abd95ca3"; // use the ownerId from your successful upsert

const tests = [
    {
        label: "Direct question from document content",
        question: "What is global warming?", // matches your sample.pdf content
    },
    {
        label: "Question with no relevant content",
        question: "What is the recipe for chocolate cake?",
    },
    {
        label: "Vague question",
        question: "Tell me more",
    },
];

const runTests = async () => {
    for (const test of tests) {
        console.log("\n========================================");
        console.log("TEST:", test.label);
        console.log("QUESTION:", test.question);
        console.log("========================================");

        try {
            const result = await askQuestion({
                ownerId: TEST_OWNER_ID,
                question: test.question,
            });

            console.log("ANSWER:", result.answer);
            console.log("SOURCES:", JSON.stringify(result.sources, null, 2));
        } catch (error) {
            console.error("ERROR:", error.message);
        }
    }
};

runTests();