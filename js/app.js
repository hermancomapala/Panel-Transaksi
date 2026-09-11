"use strict";


/* =========================================================
   GLOBAL HELPERS
========================================================= */

const STORAGE_KEY = "caseVerifyResult";


function formatBytes(bytes) {

    if (!bytes) {
        return "0 B";
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];

    const index = Math.floor(
        Math.log(bytes) / Math.log(1024)
    );

    return (
        parseFloat(
            (bytes / Math.pow(1024, index)).toFixed(2)
        )
        + " "
        + units[index]
    );
}


function sleep(ms) {

    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });

}


/* =========================================================
   TRANSACTION KEYWORDS
========================================================= */

const transactionKeywords = [

    "TRANSFER",
    "TRANSAKSI",
    "TRANSACTION",
    "PEMBAYARAN",
    "PAYMENT",

    "BERHASIL",
    "SUCCESS",
    "SUKSES",
    "COMPLETED",

    "NOMINAL",
    "TOTAL",
    "AMOUNT",

    "REKENING",
    "ACCOUNT",

    "BANK",
    "DANA",
    "OVO",
    "GOPAY",
    "SHOPEEPAY",
    "LINKAJA",

    "M-BANKING",
    "MBANKING",
    "MOBILE BANKING",

    "MUTASI",
    "SALDO",
    "BALANCE",

    "QRIS",
    "INVOICE",

    "PENERIMA",
    "PENGIRIM",
    "RECIPIENT",
    "SENDER",

    "TANGGAL",
    "DATE",

    "WAKTU",
    "TIME",

    "REF",
    "REFERENCE",

    "BIAYA",
    "FEE",

    "ADMIN",
    "ADMINISTRASI"

];


/* =========================================================
   OCR AMOUNT PARSER
========================================================= */

function extractAmount(text) {

    if (!text) {
        return null;
    }

    const patterns = [

        /(?:rp|idr)\s*([0-9][0-9.,]*)/gi,

        /(?:nominal|total|amount)\s*[:=]?\s*(?:rp|idr)?\s*([0-9][0-9.,]*)/gi

    ];

    const values = [];

    patterns.forEach(pattern => {

        let match;

        while ((match = pattern.exec(text)) !== null) {

            let raw = match[1];

            raw = raw.replace(/[^\d]/g, "");

            const value = parseInt(raw, 10);

            if (
                Number.isFinite(value) &&
                value > 0
            ) {
                values.push(value);
            }

        }

    });


    if (!values.length) {
        return null;
    }


    return Math.max(...values);
}


function formatRupiah(value) {

    if (!value) {
        return "Rp 0";
    }

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(value);

}


/* =========================================================
   SCANNER PAGE
========================================================= */

const evidenceInput =
    document.getElementById("evidenceInput");


if (evidenceInput) {

    const dropZone =
        document.getElementById("dropZone");

    const selectedFilesWrap =
        document.getElementById("selectedFilesWrap");

    const selectedFilesList =
        document.getElementById("selectedFilesList");

    const fileCountLabel =
        document.getElementById("fileCountLabel");

    const clearAllFiles =
        document.getElementById("clearAllFiles");

    const scanButton =
        document.getElementById("scanButton");

    const analysisCard =
        document.getElementById("analysisCard");

    const progressRing =
        document.getElementById("progressRing");

    const progressValue =
        document.getElementById("progressValue");

    const ocrOutput =
        document.getElementById("ocrOutput");


    let selectedEvidenceList = [];


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    /* =====================================================
       FILE SELECT
    ===================================================== */

    evidenceInput.addEventListener(
        "change",
        event => {

            const files =
                Array.from(event.target.files || []);

            if (!files.length) {
                return;
            }

            addEvidenceFiles(files);

            evidenceInput.value = "";

        }
    );


    function isDuplicateFile(file) {

        return selectedEvidenceList.some(
            existing =>
                existing.name === file.name &&
                existing.size === file.size &&
                existing.lastModified === file.lastModified
        );

    }


    function addEvidenceFiles(files) {

        const rejected = [];

        files.forEach(file => {

            if (!allowedTypes.includes(file.type)) {
                rejected.push(file.name);
                return;
            }

            if (isDuplicateFile(file)) {
                return;
            }

            selectedEvidenceList.push(file);

        });


        if (rejected.length) {

            alert(
                "Format tidak didukung untuk:\n\n" +
                rejected.join("\n") +
                "\n\nGunakan JPG, PNG atau WEBP."
            );

        }


        renderFileList();

    }


    function renderFileList() {

        selectedFilesList.innerHTML = "";

        const count =
            selectedEvidenceList.length;


        if (!count) {

            selectedFilesWrap.classList.remove(
                "active"
            );

            fileCountLabel.textContent =
                "0 bukti dipilih";

            scanButton.disabled = true;

            return;
        }


        selectedFilesWrap.classList.add(
            "active"
        );

        fileCountLabel.textContent =
            count === 1
                ? "1 bukti dipilih"
                : `${count} bukti dipilih`;


        selectedEvidenceList.forEach(
            (file, index) => {

                const item =
                    document.createElement("div");

                item.className =
                    "selected-file";

                const icon =
                    document.createElement("div");

                icon.className = "file-icon";
                icon.textContent = "IMG";

                const info =
                    document.createElement("div");

                info.className = "file-info";

                const nameEl =
                    document.createElement("strong");

                nameEl.textContent =
                    file.name;

                const sizeEl =
                    document.createElement("span");

                sizeEl.textContent =
                    formatBytes(file.size);

                info.appendChild(nameEl);
                info.appendChild(sizeEl);

                const removeBtn =
                    document.createElement("button");

                removeBtn.type = "button";
                removeBtn.className = "remove-file";
                removeBtn.dataset.index = String(index);
                removeBtn.setAttribute(
                    "aria-label",
                    `Hapus ${file.name}`
                );
                removeBtn.textContent = "×";

                item.appendChild(icon);
                item.appendChild(info);
                item.appendChild(removeBtn);

                selectedFilesList.appendChild(item);

            }
        );


        selectedFilesList.querySelectorAll(
            ".remove-file"
        ).forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    const index =
                        parseInt(
                            button.dataset.index,
                            10
                        );

                    selectedEvidenceList.splice(
                        index,
                        1
                    );

                    renderFileList();

                }
            );

        });


        scanButton.disabled = false;

    }


    /* =====================================================
       REMOVE ALL FILES
    ===================================================== */

    clearAllFiles.addEventListener(
        "click",
        event => {

            event.preventDefault();

            selectedEvidenceList = [];

            evidenceInput.value = "";

            renderFileList();

        }
    );


    /* =====================================================
       DRAG / DROP
    ===================================================== */

    dropZone.addEventListener(
        "dragover",
        event => {

            event.preventDefault();

            dropZone.style.borderColor =
                "#63f29b";

        }
    );


    dropZone.addEventListener(
        "dragleave",
        () => {

            dropZone.style.borderColor =
                "";

        }
    );


    dropZone.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            dropZone.style.borderColor =
                "";

            const files =
                Array.from(
                    event.dataTransfer.files || []
                );

            if (!files.length) {
                return;
            }

            addEvidenceFiles(files);

        }
    );


    /* =====================================================
       PROGRESS
    ===================================================== */

    function setProgress(percent) {

        const circumference =
            314;

        const offset =
            circumference -
            (percent / 100) *
            circumference;


        progressRing.style.strokeDashoffset =
            offset;


        progressValue.innerHTML = `
            <strong>${percent}%</strong>
            <span>SCAN</span>
        `;

    }


    /* =====================================================
       STEP STATE
    ===================================================== */

    function setStep(
        number,
        state,
        message
    ) {

        const step =
            document.getElementById(
                "step" + number
            );

        if (!step) {
            return;
        }


        const status =
            step.querySelector(
                ".step-status"
            );

        const description =
            step.querySelector(
                ".step-content span"
            );


        step.classList.remove(
            "active",
            "done"
        );


        if (state === "active") {

            step.classList.add(
                "active"
            );

            status.textContent =
                "…";

        }


        if (state === "done") {

            step.classList.add(
                "done"
            );

            status.textContent =
                "✓";

        }


        if (message) {

            description.textContent =
                message;

        }

    }


    /* =====================================================
       IMAGE VALIDATION
    ===================================================== */

    function validateImage(file) {

        return new Promise(
            resolve => {

                const image =
                    new Image();

                const objectUrl =
                    URL.createObjectURL(
                        file
                    );


                image.onload = () => {

                    URL.revokeObjectURL(
                        objectUrl
                    );


                    if (
                        image.width < 250 ||
                        image.height < 250
                    ) {

                        resolve({
                            valid: false,
                            reason:
                                "Resolusi gambar terlalu kecil."
                        });

                        return;
                    }


                    resolve({
                        valid: true
                    });

                };


                image.onerror = () => {

                    URL.revokeObjectURL(
                        objectUrl
                    );

                    resolve({
                        valid: false,
                        reason:
                            "File tidak dapat dibaca sebagai gambar."
                    });

                };


                image.src =
                    objectUrl;

            }
        );

    }


    /* =====================================================
       OCR
    ===================================================== */

    async function runOCR(
        file,
        progressRange
    ) {

        const rangeStart =
            progressRange?.start ?? 30;

        const rangeEnd =
            progressRange?.end ?? 70;


        const result =
            await Tesseract.recognize(
                file,
                "eng+ind",
                {
                    logger: info => {

                        if (
                            info.status ===
                            "recognizing text"
                        ) {

                            const percent =
                                Math.round(
                                    rangeStart +
                                    (
                                        info.progress *
                                        (rangeEnd - rangeStart)
                                    )
                                );

                            setProgress(
                                percent
                            );

                        }

                    }
                }
            );


        return result.data.text || "";

    }


    /* =====================================================
       CLASSIFICATION
    ===================================================== */

    function classifyEvidence(text) {

        const normalized =
            text
                .toUpperCase()
                .replace(/\s+/g, " ");


        const matches =
            transactionKeywords.filter(
                keyword =>
                    normalized.includes(
                        keyword
                    )
            );


        return {
            matches,
            isTransaction:
                matches.length >= 2
        };

    }


    /* =====================================================
       SAVE RESULT
    ===================================================== */

    function saveResult(data) {

        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );

    }


    /* =====================================================
       START SCAN
    ===================================================== */

    scanButton.addEventListener(
        "click",
        async () => {

            if (!selectedEvidenceList.length) {
                return;
            }


            scanButton.disabled = true;

            analysisCard.classList.remove(
                "hidden"
            );


            analysisCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });


            setProgress(0);


            const totalFiles =
                selectedEvidenceList.length;

            const evidenceResults = [];

            const failedFiles = [];

            let accumulatedAmount = 0;

            let combinedMatches = [];

            let combinedOcrText = "";


            /* ---------------------------------------------
               PROCESS EACH EVIDENCE FILE
            --------------------------------------------- */

            for (
                let index = 0;
                index < totalFiles;
                index += 1
            ) {

                const file =
                    selectedEvidenceList[index];

                const fileLabel =
                    `${index + 1}/${totalFiles}: ${file.name}`;


                /* -----------------------------------------
                   STEP 1
                ----------------------------------------- */

                setStep(
                    1,
                    "active",
                    `Checking image integrity (${fileLabel})...`
                );

                setProgress(
                    Math.round(
                        (index / totalFiles) * 20
                    )
                );

                await sleep(400);


                const validation =
                    await validateImage(file);


                if (!validation.valid) {

                    failedFiles.push({
                        fileName: file.name,
                        reason: validation.reason
                    });

                    continue;

                }


                setStep(
                    1,
                    "done",
                    `Image verified (${index + 1}/${totalFiles})`
                );


                /* -----------------------------------------
                   STEP 2
                ----------------------------------------- */

                setStep(
                    2,
                    "active",
                    `Extracting text (${fileLabel})...`
                );

                setProgress(
                    Math.round(
                        20 +
                        ((index + 0.5) / totalFiles) * 50
                    )
                );

                await sleep(300);


                let extractedText = "";


                try {

                    extractedText =
                        await runOCR(
                            file,
                            {
                                start:
                                    20 +
                                    (index / totalFiles) * 50,
                                end:
                                    20 +
                                    ((index + 1) / totalFiles) * 50
                            }
                        );

                } catch (error) {

                    console.error(error);

                    extractedText = "";

                }


                if (extractedText) {

                    combinedOcrText +=
                        `\n--- ${file.name} ---\n` +
                        extractedText +
                        "\n";

                }


                setStep(
                    2,
                    "done",
                    `Text extracted (${index + 1}/${totalFiles})`
                );


                /* -----------------------------------------
                   STEP 3
                ----------------------------------------- */

                setStep(
                    3,
                    "active",
                    `Searching indicators (${fileLabel})...`
                );

                await sleep(400);


                const classification =
                    classifyEvidence(
                        extractedText
                    );


                if (
                    !classification.isTransaction
                ) {

                    failedFiles.push({
                        fileName: file.name,
                        reason:
                            "Indikator transaksi tidak cukup"
                    });

                    continue;

                }


                const extractedAmount =
                    extractAmount(
                        extractedText
                    );


                if (extractedAmount) {
                    accumulatedAmount +=
                        extractedAmount;
                }


                combinedMatches =
                    combinedMatches.concat(
                        classification.matches
                    );


                evidenceResults.push({

                    fileName: file.name,

                    fileSize: file.size,

                    indicators:
                        classification.matches.length,

                    amount:
                        extractedAmount || 0

                });

            }


            ocrOutput.textContent =
                combinedOcrText.trim() ||
                "No readable text detected.";


            setProgress(88);


            const uniqueMatches = [
                ...new Set(combinedMatches)
            ];


            setStep(
                3,
                evidenceResults.length
                    ? "done"
                    : "active",
                evidenceResults.length
                    ? `${uniqueMatches.length} unique indicators across ${evidenceResults.length} bukti`
                    : "No valid transaction indicators found"
            );


            /* ---------------------------------------------
               STEP 4
            --------------------------------------------- */

            setStep(
                4,
                "active",
                "Preparing evidence classification..."
            );


            await sleep(600);


            if (!evidenceResults.length) {

                setStep(
                    4,
                    "active",
                    "Insufficient transaction indicators"
                );

                setProgress(100);


                const failureSummary =
                    failedFiles
                        .map(item =>
                            `• ${item.fileName}: ${item.reason}`
                        )
                        .join("\n");


                alert(
                    "Tidak ada bukti transaksi yang valid.\n\n" +
                    (failureSummary || "") +
                    "\n\nSilakan gunakan gambar bukti transfer/transaksi yang memiliki informasi transaksi yang terbaca."
                );


                scanButton.disabled =
                    false;

                return;
            }


            if (failedFiles.length) {

                const failureSummary =
                    failedFiles
                        .map(item =>
                            `• ${item.fileName}: ${item.reason}`
                        )
                        .join("\n");


                alert(
                    `${evidenceResults.length} dari ${totalFiles} bukti berhasil diproses.\n\n` +
                    "Bukti yang gagal:\n" +
                    failureSummary
                );

            }


            setStep(
                4,
                "done",
                `${evidenceResults.length} bukti transaksi diklasifikasikan`
            );


            setProgress(100);


            /* ---------------------------------------------
               RESULT VALUE (ACCUMULATED)
            --------------------------------------------- */

            /*
             * IMPORTANT:
             *
             * Nilai ini hanya digunakan untuk
             * tampilan DEMO.
             *
             * Tidak merepresentasikan saldo,
             * kerugian, atau transaksi nyata.
             */

            const simulatedAmount =
                accumulatedAmount ||
                1250000;


            const resultData = {

                fileName:
                    evidenceResults.length === 1
                        ? evidenceResults[0].fileName
                        : `${evidenceResults.length} bukti transaksi`,

                fileCount:
                    evidenceResults.length,

                files:
                    evidenceResults,

                fileSize:
                    evidenceResults.reduce(
                        (sum, item) =>
                            sum + item.fileSize,
                        0
                    ),

                indicators:
                    uniqueMatches.length,

                matches:
                    uniqueMatches,

                simulatedValue:
                    simulatedAmount,

                timestamp:
                    new Date().toISOString(),

                simulation:
                    true

            };


            saveResult(
                resultData
            );


            /* ---------------------------------------------
               MOVE TO RESULT PAGE
            --------------------------------------------- */

            await sleep(700);


            window.location.href =
                "result.html";

        }
    );

}


/* =========================================================
   RESULT PAGE
========================================================= */

const lossAmount =
    document.getElementById(
        "lossAmount"
    );


if (lossAmount) {

    const raw =
        sessionStorage.getItem(
            STORAGE_KEY
        );


    if (!raw) {

        window.location.href =
            "index.html";

    } else {

        let data = null;


        try {

            data =
                JSON.parse(raw);

        } catch (error) {

            window.location.href =
                "index.html";

        }


        if (data) {

            const reportFile =
                document.getElementById(
                    "reportFile"
                );

            const reportFileDetail =
                document.getElementById(
                    "reportFileDetail"
                );


            reportFile.textContent =
                data.fileName || "—";


            if (
                reportFileDetail &&
                Array.isArray(data.files) &&
                data.files.length > 1
            ) {

                const fileNames =
                    data.files
                        .map(item => item.fileName)
                        .join(", ");


                reportFileDetail.textContent =
                    fileNames;

            } else if (reportFileDetail) {

                reportFileDetail.textContent = "";

            }


            document.getElementById(
                "reportIndicators"
            ).textContent =
                data.indicators || 0;


            lossAmount.textContent =
                formatRupiah(
                    data.simulatedValue
                );

        }

    }


    const openMedia =
        document.getElementById(
            "openMedia"
        );


    if (openMedia) {

        openMedia.addEventListener(
            "click",
            () => {

                window.location.href =
                    "media.html";

            }
        );

    }

}