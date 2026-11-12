const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTH-mPBuCqXvkNGMT8h5B-9hAup6ra0B24RcqIZvuAyDYN9ItKmToJ1RhbJRphLtH1ucUiTdhBSEpK/pub?gid=0&single=true&output=csv';

// Обработка нажатия кнопки
const actionButton = document.getElementById('actionButton');
const message = document.getElementById('message');

actionButton.addEventListener('click', () => {
    console.log('Кнопка нажата');
    message.textContent = 'Кнопка нажата! Текст изменён.';
});

// Загрузка данных из Google Таблицы
async function loadData() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const table = document.getElementById('dataTable');
    const dataBody = document.getElementById('dataBody');

    try {
        const response = await fetch(SHEET_URL);

        // исправлено: добавлена проверка HTTP-ответа сервера
        if (!response.ok) {
            throw new Error(`Ошибка загрузки: ${response.status}`);
        }

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        if (rows.length < 2) {
            throw new Error('Таблица не содержит данных.');
        }

        const headers = rows[0].map(header => header.trim().toLowerCase());

        const titleIndex = headers.indexOf('название');
        const authorIndex = headers.indexOf('автор');
        const yearIndex = headers.indexOf('год');

        // исправлено: добавлена проверка названий столбцов
        if (titleIndex === -1 || authorIndex === -1 || yearIndex === -1) {
            throw new Error('Не найдены необходимые столбцы таблицы.');
        }

        dataBody.innerHTML = '';

        rows.slice(1).forEach(row => {
            if (!row.some(value => value.trim())) {
                return;
            }

            if (row.length <= Math.max(titleIndex, authorIndex, yearIndex)) {
                return;
            }

            const tr = document.createElement('tr');

            [titleIndex, authorIndex, yearIndex].forEach(index => {
                const td = document.createElement('td');
                td.textContent = row[index].trim();
                tr.appendChild(td);
            });

            dataBody.appendChild(tr);
        });

        if (!dataBody.children.length) {
            throw new Error('В таблице нет подходящих строк.');
        }

        loading.hidden = true;
        table.hidden = false;

    } catch (err) {
        console.error('Ошибка:', err);

        loading.hidden = true;
        error.textContent = `Не удалось загрузить данные: ${err.message}`;
    }
}

// исправлено: добавлен разбор CSV с учётом кавычек,
// чтобы запятые внутри значений не нарушали структуру данных.
function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"' && insideQuotes && text[i + 1] === '"') {
            value += '"';
            i++;
        } else if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            row.push(value);
            value = '';
        } else if ((char === '\n' || char === '\r') && !insideQuotes) {
            if (char === '\r' && text[i + 1] === '\n') {
                i++;
            }

            row.push(value);
            rows.push(row);
            row = [];
            value = '';
        } else {
            value += char;
        }
    }

    if (value.length || row.length) {
        row.push(value);
        rows.push(row);
    }

    return rows;
}

loadData();