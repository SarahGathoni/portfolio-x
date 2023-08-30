import React, { useState , useEffect} from 'react';
import { FaUpload } from 'react-icons/fa';
import FileInput from '../pages/FileInput';
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "langchain/chat_models/openai";
//import {HNSWLib} from "langchain/vectorstores";
//import {TextLoader} from "langchain/document_loaders"
import axios from "axios"

export default function Work() {
  const [res, setRes] = useState('');
  const [scrapeData, setScrapeData] = useState('');
 
  useEffect(() => {
    // Define the API endpoint
    const apiUrl = 'http://localhost:3002/scrapper-info';

    // Fetch data from the API using Axios
    axios.get(apiUrl)
      .then(response => {
        setScrapeData(response.data.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  console.log("SCRAPED DATA", scrapeData)

  const openai = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    //const configs = import.meta.env.configuration

    console.log("API KEY", apiKey)

    const loader = new CheerioWebBaseLoader(
      scrapeData
    );
    const data = await loader.load();

    console.log("DATA OPEN AI", data)

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 0,
    });

    const splitDocs = await textSplitter.splitDocuments(data);


    console.log("splitDocs", splitDocs)

    //const embeddings = new OpenAIEmbeddings(apiKey);

    console.log("embeddings")

    const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, new OpenAIEmbeddings());
    console.log('got the api key')

    console.log("vectorStore", vectorStore)
    
    const relevantDocs = await vectorStore.similaritySearch("");

    console.log("QUERRY HERE",relevantDocs.length);

    const model = new ChatOpenAI({ modelName: "gpt-3.5-turbo"});
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    const response = await chain.call({
      query: ""
    });

    const messageContent = response;
    setRes(messageContent);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    await openai();
     response? console.log('fetch success'): console.log('failed')
  };

  return (
    <>
      <div className='flex justify-center items-center gap-10'>
        {/* Card 1 */}
        <div className='p-6 bg-white rounded-lg shadow-lg w-[600px]'>
          <form onSubmit={handleFormSubmit}>
            <h1 className='font-bold text-2xl'>Make a custom job search</h1>
            <div className="flex search">
              {/* Wrap the input and button in a flex container */}
              <input placeholder="senior software developer, remote " type="text" style={{ width: "400px" }}/>
              <button type="submit">Send</button>
            </div>
            <br />
            {/* Conditionally render the textarea based on the response */}
            {res && <textarea value={res} name="" id="" cols="30" rows="10"></textarea>}
          </form>
        </div>

        {/* Card 2 */}
        <div className='p-6 bg-white rounded-lg shadow-lg justify-center items-center'>
          <div className='flex justify-center items-center'>
            <h1>Upload Resume</h1>
            <FaUpload size={34} className='customPurple ml-4' />
          </div>
          <FileInput />
        </div>
        {/* Card 2 */}
        <div className='p-6 bg-white rounded-lg shadow-lg w-96'>
          <div className='flex justify-center items-center'>
            <h1>Upload Cover Letter</h1>
            <FaUpload size={34} className='customPurple ml-4' />
          </div>
          <FileInput />
        </div>
      </div>
    </>
  );
}
