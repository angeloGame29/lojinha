
let products =
JSON.parse(localStorage.getItem("products")) || [];

renderProducts();

document
.getElementById("product-form")
.addEventListener("submit", saveProduct);

function saveProduct(e) {
    e.preventDefault();

    const file = document.getElementById("image").files[0];

    if (!file) {
        alert("Selecione uma imagem!");
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {

        const product = {
            id: Date.now(),
            name: document.getElementById("name").value,
            cat: document.getElementById("cat").value,
            image: reader.result,
            price: Number(document.getElementById("price").value),
            oldPrice: Number(document.getElementById("oldPrice").value),
            desc: document.getElementById("desc").value,
            stars: Number(document.getElementById("stars").value),
            badge: document.getElementById("badge").value,
            badgeType: document.getElementById("badgeType").value,
            promo: document.getElementById("promo").checked
        };

        products.push(product);

        localStorage.setItem("products", JSON.stringify(products));

        renderProducts();

        e.target.reset();
    };

    reader.readAsDataURL(file);
}

function renderProducts() {
    const list = document.getElementById("products-list");

    list.innerHTML = "";

    products.forEach(product => {
        const div = document.createElement("div");

        div.style.border = "1px solid #ccc";
        div.style.padding = "10px";
        div.style.marginBottom = "10px";

        div.innerHTML = `
            <h3>${product.name}</h3>
            <p><strong>Categoria:</strong> ${product.cat}</p>
            <p><strong>Preço:</strong> R$ ${product.price}</p>
            <p>${product.desc}</p>

            <img src="${product.image}" width="120" />

            <br><br>

            <button onclick="deleteProduct(${product.id})">
                Excluir
            </button>
        `;

        list.appendChild(div);
    });
}

// PASSO 4 AQUI
function deleteProduct(id) {

    products =
    products.filter(p => p.id !== id);

    localStorage.setItem(
        "products",
        JSON.stringify(products)
    );

    renderProducts();

}