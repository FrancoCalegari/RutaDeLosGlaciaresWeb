  // ========== FUNCIONES CRUD BACKGROUND ==========
    function saveBackground() {
      const data = {
        src: document.getElementById('bgSrc').value,
        alt: document.getElementById('bgAlt').value
      };
      fetch('/api/background', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }

    // ========== CRUD IMÁGENES ==========
    function addImage() {
      const src = document.getElementById('newImgSrc').value;
      const alt = document.getElementById('newImgAlt').value;
      fetch('/api/images', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ src, alt }) })
        .then(() => location.reload());
    }

    function updateImage(i) {
      const el = document.querySelector(`[data-index='${i}']`);
      const src = el.querySelector('.img-src').value;
      const alt = el.querySelector('.img-alt').value;
      fetch('/api/images/' + i, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ src, alt }) })
        .then(() => location.reload());
    }

    function deleteImage(i) {
      fetch('/api/images/' + i, { method: 'DELETE' }).then(() => location.reload());
    }

    // ========== CRUD SUMMARY ==========
    function saveSummary() {
      fetch('/api/summary', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: document.getElementById('summaryTitle').value,
          description: document.getElementById('summaryDesc').value
        })
      });
    }

    // ========== CRUD SERVICES ==========
    function addService() {
      const title = document.getElementById('newServiceTitle').value;
      const content = document.getElementById('newServiceContent').value;
      fetch('/api/services', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ title, content }) })
        .then(() => location.reload());
    }

    function updateService(i) {
      const el = document.querySelector(`[data-index='${i}']`);
      const title = el.querySelector('.service-title').value;
      const content = el.querySelector('.service-content').value;
      fetch('/api/services/' + i, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ title, content }) })
        .then(() => location.reload());
    }

    function deleteService(i) {
      fetch('/api/services/' + i, { method: 'DELETE' }).then(() => location.reload());
    }

    // ========== CRUD ADVANTAGES ==========
    function addAdvantage() {
      const strong = document.getElementById('newAdvStrong').value;
      const text = document.getElementById('newAdvText').value;
      fetch('/api/advantages', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ strong, text }) // ⚡ asegurarse que la API reciba {strong,text}
      })
      .then(res => res.json())
      .then(() => location.reload())
      .catch(err => console.error(err));
    }


    function updateAdvantage(i) {
      const el = document.querySelector(`[data-index='${i}']`);
      const strong = el.querySelector('.adv-strong').value;
      const text = el.querySelector('.adv-text').value;
      fetch('/api/advantages/' + i, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ strong, text }) })
        .then(() => location.reload());
    }

    function deleteAdvantage(i) {
      fetch('/api/advantages/' + i, { method: 'DELETE' }).then(() => location.reload());
    }

    // ========== CRUD COSTS ==========
    function addCost() {
    const item = document.getElementById('newCost').value;
    fetch('/api/costs', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({ item }) // ⚡ aquí debe llamarse "item"
    })
    .then(res => {
      if (!res.ok) throw new Error('Error al agregar el costo');
      return res.json();
    })
    .then(() => location.reload())
    .catch(err => console.error(err));
    }


    function updateCost(i) {
      const el = document.querySelector(`[data-index='${i}']`);
      const value = el.querySelector('.cost-item').value;
      fetch('/api/costs/' + i, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ value }) })
        .then(() => location.reload());
    }

    function deleteCost(i) {
      fetch('/api/costs/' + i, { method: 'DELETE' }).then(() => location.reload());
    }

   // ========== CRUD PRODUCTOS ==========
  function addProducto() {
    const nombreProducto = document.getElementById("nombreProducto").value;
    const detalleProducto = document.getElementById("detalleProducto").value;
    const extrasProducto = document.getElementById("extrasProducto").value;
    const precioProducto = document.getElementById("precioProducto").value;
    const descuentoProducto = document.getElementById("descuentoProducto").value;
    const imagenesProducto = document.getElementById("imagenesProducto").value.split(",");

    fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreProducto,
        detalleProducto,
        extrasProducto,
        precioProducto,
        descuentoProducto,
        imagenesProducto
      })
    }).then(() => location.reload());
  }

  function updateProducto(id) {
    const el = document.querySelector(`[data-producto='${id}']`);
    const nombreProducto = el.querySelector(".nombreProducto").value;
    const detalleProducto = el.querySelector(".detalleProducto").value;
    const extrasProducto = el.querySelector(".extrasProducto").value;
    const precioProducto = el.querySelector(".precioProducto").value;
    const descuentoProducto = el.querySelector(".descuentoProducto").value;
    const imagenesProducto = el.querySelector(".imagenesProducto").value.split(",");

    fetch(`/api/productos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreProducto,
        detalleProducto,
        extrasProducto,
        precioProducto,
        descuentoProducto,
        imagenesProducto
      })
    }).then(() => location.reload());
  }

  function deleteProducto(id) {
    fetch(`/api/productos/${id}`, { method: "DELETE" }).then(() => location.reload());
  }



// ========= CRUD IMÁGENES (con id) =========
function addImage() {
  const src = document.getElementById('newImgSrc').value;
  const alt = document.getElementById('newImgAlt').value;
  fetch('/api/images', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ src, alt })
  }).then(() => location.reload());
}

function updateImageById(id) {
  const el = document.querySelector(`[data-id='${id}']`);
  const src = el.querySelector('.img-src').value;
  const alt = el.querySelector('.img-alt').value;
  fetch(`/api/images/${id}`, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ src, alt })
  })
  .then(res => {
    if (!res.ok) throw new Error('Error al actualizar imagen');
    return res.json();
  })
  .then(() => location.reload())
  .catch(console.error);
}

function deleteImageById(id) {
  fetch(`/api/images/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('Error al eliminar imagen');
      return res.json();
    })
    .then(() => location.reload())
    .catch(console.error);
}

// ========= WRAPPERS de compatibilidad (index -> id) =========
function updateImage(index) {
  const item = document.querySelector(`[data-index='${index}'], [data-id]`); 
  // si todavía tenés data-index en algún template viejo
  const idAttr = item?.getAttribute('data-id');
  if (!idAttr) return console.error('No se pudo resolver el id desde el index', index);
  updateImageById(parseInt(idAttr, 10));
}

function deleteImage(index) {
  const item = document.querySelector(`[data-index='${index}'], [data-id]`);
  const idAttr = item?.getAttribute('data-id');
  if (!idAttr) return console.error('No se pudo resolver el id desde el index', index);
  deleteImageById(parseInt(idAttr, 10));
}



