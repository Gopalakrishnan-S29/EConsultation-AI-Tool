document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csvFile");
  const textInput = document.getElementById("textInput");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const clearBtn = document.getElementById("clearBtn");
  const resultsContainer = document.querySelector(".results");
  const popup = document.getElementById("popupMessage");

  const stopWords = ["the","is","was","to","but","as","and","a","an","in","on","for",
    "of","with","this","that","it","at","by","from","are","be","has","had","have","i"];

  // CSV upload autofill
  fileInput.addEventListener("change", () => {
    if(fileInput.files.length > 0){
      const reader = new FileReader();
      reader.onload = e => textInput.value = e.target.result;
      reader.readAsText(fileInput.files[0]);
    }
  });

  // Analyze button
  analyzeBtn.addEventListener("click", () => {
    resultsContainer.innerHTML = "";
    let comments = [];

    if(fileInput.files.length > 0 || textInput.value.trim() !== ""){
      comments = textInput.value.trim().split("\n").filter(c => c.trim() !== "");

      // Show "Analyzing..." only if slow
      let popupTimeout = setTimeout(() => {
        popup.textContent = "Analyzing content...";
        popup.style.display = "block";
      }, 500);

      setTimeout(() => {
        clearTimeout(popupTimeout);
        showResults(comments);
        popup.textContent = "Your analysis is ready!";
        popup.style.display = "block";
        setTimeout(() => popup.style.display = "none", 4000);
      }, 50);

    } else {
      alert("Please upload a CSV file or paste some comments.");
    }
  });

  // Clear button
  clearBtn.addEventListener("click", () => {
    fileInput.value = "";
    textInput.value = "";
    resultsContainer.innerHTML = "";
    const wc = document.getElementById("wordCloud");
    if(wc) wc.innerHTML = "";
    if(window.sentimentChartInstance) window.sentimentChartInstance.destroy();
  });

  // Show results function
  function showResults(comments){
    // Sentiment counts
    let posCount = 0, neuCount = 0, negCount = 0;
    const positiveWords = ["great","excellent","fantastic","impressed","commendable","helpful","outstanding","appreciated","improve"];
    const negativeWords = ["late","disappointed","incomplete","needs","errors","bugs","frustrated","confusing","missed"];

    comments.forEach(line => {
      const text = line.toLowerCase();
      const posMatch = positiveWords.some(w => text.includes(w));
      const negMatch = negativeWords.some(w => text.includes(w));

      if(posMatch && !negMatch) posCount++;
      else if(negMatch && !posMatch) negCount++;
      else neuCount++;
    });

    const total = comments.length;
    const posPercent = ((posCount / total) * 100).toFixed(1);
    const neuPercent = ((neuCount / total) * 100).toFixed(1);
    const negPercent = ((negCount / total) * 100).toFixed(1);

    // Determine final suggestion
    let suggestion = "";
    if(posPercent > 60) suggestion = "Overall feedback is positive. Continue current practices.";
    else if(negPercent > 40) suggestion = "Feedback shows concern. Immediate improvements recommended.";
    else suggestion = "Mixed feedback. Review key points and improve where necessary.";

    // Render results
    resultsContainer.innerHTML = `
      <div class="card">
        <h3>📊 Sentiment Analysis</h3>
        <p><strong>Positive:</strong> ${posPercent}%</p>
        <p><strong>Neutral:</strong> ${neuPercent}%</p>
        <p><strong>Negative:</strong> ${negPercent}%</p>
      </div>
      <div class="card">
        <h3>📝 Summary</h3>
        <p>Based on ${total} comments, the analysis highlights key concerns.</p>
      </div>
      <div class="card">
        <h3>☁️ Word Cloud</h3>
        <div id="wordCloud" class="wordcloud">Generating...</div>
      </div>
      <div class="card">
        <h3>📈 Sentiment Chart</h3>
        <canvas id="sentimentChart"></canvas>
      </div>
      <div class="card">
        <h3>💡 Final Suggestion</h3>
        <p>${suggestion}</p>
      </div>
    `;

    // Word Cloud
    setTimeout(() => {
      const freqMap = {};
      comments.forEach(line => {
        line.replace(/[^a-zA-Z\s]/g,"").toLowerCase().split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.includes(w))
          .forEach(w => freqMap[w] = (freqMap[w] || 0) + 1);
      });
      const wordArray = Object.entries(freqMap).sort((a,b)=>b[1]-a[1]);

      WordCloud(document.getElementById("wordCloud"), {
        list: wordArray.length>0? wordArray : [["feedback",10],["service",8],["quality",7]],
        gridSize: 10,
        weightFactor: 8,
        fontFamily: "Arial, sans-serif",
        color: () => `hsl(${Math.random()*360},70%,50%)`,
        rotateRatio: 0.5,
        rotationSteps: 2,
        backgroundColor: "#fafafa",
        shuffle: true
      });
    }, 300);

    // Sentiment Chart
   const ctx = document.getElementById("sentimentChart").getContext("2d"); if(window.sentimentChartInstance) window.sentimentChartInstance.destroy(); window.sentimentChartInstance = new Chart(ctx,{ type:"doughnut", data:{ labels:["Positive","Neutral","Negative"], datasets:[{ data:[posPercent, neuPercent, negPercent], backgroundColor:["#28a745","#ffc107","#dc3545"], borderWidth:2, borderColor:"#ffffff" }] }, options:{ responsive:true, maintainAspectRatio:true, cutout:"40%", plugins:{ legend:{position:"bottom", labels:{boxWidth:20,padding:15}}, tooltip:{enabled:true}} } }); } });