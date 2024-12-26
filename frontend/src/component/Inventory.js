import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf'; // Import jsPDF
import Navigation from './NavigationInventory';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form, Table, Alert } from 'react-bootstrap'; // Import Bootstrap components
import { Bar } from 'react-chartjs-2'; // Import Bar chart from react-chartjs-2
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import 'jspdf-autotable';
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Inventory() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // State for selected item for updating
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const [showChart, setShowChart] = useState(false); // State to toggle chart visibility

  // Predefined user information
  const userName = 'chathula chanchana';
  const userEmail = 'chatulacc2002@gmail.com';
  const userPhone = '0701014066';
  const userAddress = 'no.94 bandarawela';

  // Define logo path (make sure this is a valid image path)
  const logo = '/Logo/logo2.jpg'; // Replace with your logo path

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('http://localhost:5000/inventory');
        setInventoryItems(response.data);
      } catch (error) {
        setError('Error fetching inventory items');
        console.error('Error fetching inventory items:', error);
      }
    };

    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`http://localhost:5000/inventory/${id}`);
        setInventoryItems(prevItems => prevItems.filter(item => item._id !== id));
      } catch (error) {
        setError('Error deleting item');
        console.error('Error deleting item:', error);
      }
    }
  };

  // PDF generation function using filtered items
  const generateReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const timestamp = new Date().toLocaleString();

    // Add footer function with timestamp on every page
    const addFooter = (pageNumber) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.setTextColor(100);
      const footerText = `Page ${pageNumber} of ${pageCount}`;
      doc.text(timestamp, margin, pageHeight - 10);
      doc.text(footerText, pageWidth - margin - doc.getTextWidth(footerText), pageHeight - 10);
    };

    // Prepare table data
    const filteredItems = inventoryItems.filter(item => {
      return (
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    const tableData = filteredItems.map(item => [
      item.itemName || 'Unnamed Item',
      item.sku || 'N/A',
      item.category || 'N/A',
      item.quantity !== undefined ? String(item.quantity) : 'N/A',
      `$${(typeof item.price === 'number' ? item.price.toFixed(2) : '0.00')}`,
      item.supplier || 'N/A',
      item.reorderLevel !== undefined ? String(item.reorderLevel) : 'N/A',
      item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : 'N/A',
    ]);

    // Set the columns for the table
    const columns = [
      { title: 'Item Name', dataKey: 'itemName' },
      { title: 'SKU', dataKey: 'sku' },
      { title: 'Category', dataKey: 'category' },
      { title: 'Quantity', dataKey: 'quantity' },
      { title: 'Price', dataKey: 'price' },
      { title: 'Supplier', dataKey: 'supplier' },
      { title: 'Reorder Level', dataKey: 'reorderLevel' },
      { title: 'Date Added', dataKey: 'dateAdded' },
    ];

    doc.autoTable(columns, tableData);
    addFooter(doc.internal.getNumberOfPages());

    // Save the PDF
    doc.save(`Inquiries_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  // Prepare chart data for item quantities
  const getChartData = () => {
    const itemNames = inventoryItems.map(item => item.itemName || 'Unnamed Item');
    const itemQuantities = inventoryItems.map(item => item.quantity || 0);

    return {
      labels: itemNames,
      datasets: [
        {
          label: 'Quantity',
          data: itemQuantities,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Function to handle form submission for updating an item
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (selectedItem) {
      try {
        await axios.put(`http://localhost:5000/inventory/${selectedItem._id}`, selectedItem);
        setInventoryItems(prevItems =>
          prevItems.map(item => (item._id === selectedItem._id ? selectedItem : item))
        );
        setShowModal(false); // Close modal
        setSelectedItem(null); // Reset selected item
      } catch (error) {
        setError('Error updating item');
        console.error('Error updating item:', error);
      }
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    return (
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="container mt-4">
      <h2 className="text-center">Inventory Management</h2>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Search by item name, SKU, category, or supplier"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Inventory Table */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Supplier</th>
            <th>Reorder Level</th>
            <th>Date Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map(item => (
            <tr key={item._id}>
              <td>{item.itemName || 'Unnamed Item'}</td>
              <td>{item.sku || 'N/A'}</td>
              <td>{item.category || 'N/A'}</td>
              <td>
                {item.quantity !== undefined ? item.quantity : 'N/A'}
                {/* Display reorder alert if quantity is less than 4 */}
                {item.quantity < 4 && (
                  <Alert variant="warning" className="mt-2">
                    Low stock! Please reorder.
                  </Alert>
                )}
              </td>
              <td>{`$${(typeof item.price === 'number' ? item.price.toFixed(2) : '0.00')}`}</td>
              <td>{item.supplier || 'N/A'}</td>
              <td>{item.reorderLevel !== undefined ? item.reorderLevel : 'N/A'}</td>
              <td>{item.dateAdded ? new Date(item.dateAdded).toLocaleDateString() : 'N/A'}</td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedItem(item);
                    setShowModal(true);
                  }}
                >
                  Update
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="ml-2"
                  onClick={() => handleDelete(item._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal for updating an item */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateItem}>
            <Form.Group controlId="itemName">
              <Form.Label>Item Name</Form.Label>
              <Form.Control
                type="text"
                value={selectedItem ? selectedItem.itemName : ''}
                onChange={(e) => setSelectedItem({...selectedItem, itemName: e.target.value})}
              />
            </Form.Group>
            <Button variant="primary" type="submit">Save Changes</Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Chart Toggle Button */}
      <Button className="mt-3" onClick={() => setShowChart(!showChart)}>
        {showChart ? 'Hide Chart' : 'Show Chart'}
      </Button>

      {/* Display the chart if showChart is true */}
      {showChart && (
        <div className="mt-4">
          <Bar data={getChartData()} />
        </div>
      )}

      {/* Generate PDF Button */}
      <Button className="mt-3" variant="success" onClick={generateReport}>
        Generate Report
      </Button>

    </div>
  );
}
