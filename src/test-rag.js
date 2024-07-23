import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { config } from "./lib/pg.js";

(async () => {
  const pgvectorStore = await PGVectorStore.initialize(new OpenAIEmbeddings(), config);
  
  const content = [
    {
      id: "3b26c6e6-20ea-40d9-80a5-0a5aa47b7788",
      content: "First Task - black ocean cold and dark, i am a hungry shark, fast and merciless."
    },
    {
      id: "b8ca7ac4-4ed3-48c6-8006-a757227edfa7",
      content: "Second Task - but the only girl that could talk to him"
    },	
    {
      id: "dfc94540-9272-4585-900a-6b86f49ef269",
      content: "Third Task - just couldn't swim tell me what's worse than this"
    },	
    {
      id: "d6bcb139-df4a-4a9f-bdec-6e1e6d3fb5ef",
      content: "Fourth Task	- and it echoes in the halls they danced along the walls"
    },	
    {
      id: "a8985111-d273-45e6-84ff-e96992ef203c",
      content: "Fifthask - tomorrow"
    },	
    {
      id: "83b6fd99-a99a-4242-b100-f3059538a9e0",
      content: "i am the storm - what a wicked thing to say"
    },	
    {
      id: "7254c760-b0e2-496f-9eb3-44322995ccaf",
      content: "black clouds and isolation - i am reclaimer of my name"
    }
  ]
  
  await pgvectorStore.addDocuments(content.map(c => (
    {
      pageContent: c.content,
      metadata: { id: c.id },
      id: c.id
    }
  )));
  
  const results = await pgvectorStore.similaritySearch("mc pipokinha", 1);
  
  console.log("results", results);

  await pgvectorStore.end();
})();
/*
  [ Document { pageContent: 'Cat drinks milk', metadata: { a: 1 } } ]
*/

// Filtering is supported
// const results2 = await pgvectorStore.similaritySearch("water", 1, {
//   a: 2, //TODO: board_id ou owner_id
// });

// console.log(results2);

/*
  [ Document { pageContent: 'what's this', metadata: { a: 2 } } ]
*/

// Filtering on multiple values using "in" is supported too
// const results3 = await pgvectorStore.similaritySearch("water", 1, {
//   a: {
//     in: [2], //TODO: vários owner_id
//   },
// });

// console.log(results3);

/*
  [ Document { pageContent: 'what's this', metadata: { a: 2 } } ]
*/

