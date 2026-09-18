package com.mensclothingstore.backend.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.mensclothingstore.backend.entity.InStoreSale;
import com.mensclothingstore.backend.entity.InStoreSaleItem;
import com.mensclothingstore.backend.entity.Invoice;
import com.mensclothingstore.backend.entity.Order;
import com.mensclothingstore.backend.entity.OrderItem;
import com.mensclothingstore.backend.repository.InStoreSaleItemRepository;
import com.mensclothingstore.backend.repository.InStoreSaleRepository;
import com.mensclothingstore.backend.repository.InvoiceRepository;
import com.mensclothingstore.backend.repository.OrderItemRepository;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class InvoicePdfService {

    private final InvoiceRepository invoiceRepository;
    private final InStoreSaleRepository inStoreSaleRepository;
    private final InStoreSaleItemRepository inStoreSaleItemRepository;
    private final OrderItemRepository orderItemRepository;

    public InvoicePdfService(
            InvoiceRepository invoiceRepository,
            InStoreSaleRepository inStoreSaleRepository,
            InStoreSaleItemRepository inStoreSaleItemRepository,
            OrderItemRepository orderItemRepository) {

        this.invoiceRepository = invoiceRepository;
        this.inStoreSaleRepository = inStoreSaleRepository;
        this.inStoreSaleItemRepository = inStoreSaleItemRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public byte[] generateSaleInvoicePdf(Long saleId) {

        InStoreSale sale = inStoreSaleRepository.findById(saleId)
                .orElseThrow(() ->
                        new RuntimeException("Sale not found")
                );

        Invoice invoice = invoiceRepository.findBySale_SaleId(saleId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invoice not found for this sale"
                        )
                );

        List<InStoreSaleItem> items =
                inStoreSaleItemRepository.findBySale_SaleId(saleId);

        try {

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            Document document = new Document();

            PdfWriter.getInstance(document, outputStream);

            document.open();

            // Shop details
            document.add(
                    new Paragraph("MENS FASHION STORE")
            );

            document.add(
                    new Paragraph(
                            "Main Road, Mangalore, Karnataka - 575001"
                    )
            );

            document.add(
                    new Paragraph("Phone: 9876543210")
            );

            document.add(new Paragraph(" "));

            // Invoice information
            document.add(
                    new Paragraph(
                            "Invoice Number: "
                                    + invoice.getInvoiceNumber()
                    )
            );

            document.add(
                    new Paragraph(
                            "Sale Number: "
                                    + sale.getSaleNumber()
                    )
            );

            DateTimeFormatter formatter =
                    DateTimeFormatter.ofPattern(
                            "dd-MM-yyyy HH:mm"
                    );

            if (invoice.getIssuedAt() != null) {

                document.add(
                        new Paragraph(
                                "Date: "
                                        + invoice.getIssuedAt()
                                        .format(formatter)
                        )
                );
            }

            document.add(new Paragraph(" "));

            // Customer information
            document.add(
                    new Paragraph(
                            "Customer: "
                                    + (sale.getCustomerName() != null
                                    ? sale.getCustomerName()
                                    : "Walk-in Customer")
                    )
            );

            if (sale.getCustomerPhone() != null) {

                document.add(
                        new Paragraph(
                                "Phone: "
                                        + sale.getCustomerPhone()
                        )
                );
            }

            document.add(
                    new Paragraph(
                            "Payment Method: "
                                    + sale.getPaymentMethod()
                    )
            );

            document.add(new Paragraph(" "));

            // Items table
            PdfPTable table = new PdfPTable(5);

            table.setWidthPercentage(100);

            table.addCell(new Phrase("Item"));
            table.addCell(new Phrase("Qty"));
            table.addCell(new Phrase("Price"));
            table.addCell(new Phrase("Discount"));
            table.addCell(new Phrase("Subtotal"));

            for (InStoreSaleItem item : items) {

                String productName =
                        item.getVariant()
                                .getProduct()
                                .getProductName();

                table.addCell(
                        new Phrase(productName)
                );

                table.addCell(
                        new Phrase(
                                String.valueOf(
                                        item.getQuantity()
                                )
                        )
                );

                table.addCell(
                        new Phrase(
                                "Rs. "
                                        + item.getUnitPrice()
                        )
                );

                table.addCell(
                        new Phrase(
                                "Rs. "
                                        + item.getDiscount()
                        )
                );

                BigDecimal subtotal =
                        item.getFinalPrice()
                                .multiply(
                                        BigDecimal.valueOf(
                                                item.getQuantity()
                                        )
                                );

                table.addCell(
                        new Phrase(
                                "Rs. "
                                        + subtotal
                        )
                );
            }

            document.add(table);

            document.add(new Paragraph(" "));

            // Totals
            document.add(
                    new Paragraph(
                            "Total Discount: Rs. "
                                    + sale.getTotalDiscount()
                    )
            );

            document.add(
                    new Paragraph(
                            "TOTAL: Rs. "
                                    + sale.getTotalAmount()
                    )
            );

            document.add(new Paragraph(" "));

            document.add(
                    new Paragraph(
                            "Thank you for shopping with us!"
                    )
            );

            document.close();

            return outputStream.toByteArray();

        } catch (DocumentException e) {

            throw new RuntimeException(
                    "Failed to generate invoice PDF",
                    e
            );
        }
    }

    public byte[] generateOrderInvoicePdf(Long orderId) {

        Invoice invoice = invoiceRepository.findByOrder_OrderId(orderId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invoice not found for this order"
                        )
                );

        Order order = invoice.getOrder();

        if (order == null) {
            throw new RuntimeException(
                    "Online order not found for this invoice"
            );
        }

        List<OrderItem> items =
                orderItemRepository.findByOrder_OrderId(orderId);

        try {

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            Document document = new Document();

            PdfWriter.getInstance(document, outputStream);

            document.open();

            // Shop details
            document.add(
                    new Paragraph("MENS FASHION STORE")
            );

            document.add(
                    new Paragraph(
                            "Main Road, Mangalore, Karnataka - 575001"
                    )
            );

            document.add(
                    new Paragraph("Phone: 9876543210")
            );

            document.add(new Paragraph(" "));

            // Invoice information
            document.add(
                    new Paragraph(
                            "Invoice Number: "
                                    + invoice.getInvoiceNumber()
                    )
            );

            document.add(
                    new Paragraph(
                            "Order Number: "
                                    + order.getOrderNumber()
                    )
            );

            DateTimeFormatter formatter =
                    DateTimeFormatter.ofPattern(
                            "dd-MM-yyyy HH:mm"
                    );

            if (invoice.getIssuedAt() != null) {

                document.add(
                        new Paragraph(
                                "Date: "
                                        + invoice.getIssuedAt()
                                        .format(formatter)
                        )
                );
            }

            document.add(new Paragraph(" "));

            // Customer information
            document.add(
                    new Paragraph(
                            "Customer ID: "
                                    + order.getCustomer().getUserId()
                    )
            );

            document.add(
                    new Paragraph(
                            "Phone: "
                                    + order.getPhoneSnapshot()
                    )
            );

            document.add(
                    new Paragraph(
                            "Address: "
                                    + order.getAddressSnapshot()
                    )
            );

            document.add(new Paragraph(" "));

            // Items table
            PdfPTable table = new PdfPTable(5);

            table.setWidthPercentage(100);

            table.addCell(new Phrase("Item"));
            table.addCell(new Phrase("Qty"));
            table.addCell(new Phrase("Price"));
            table.addCell(new Phrase("Discount"));
            table.addCell(new Phrase("Subtotal"));

            for (OrderItem item : items) {

                String productName =
                        item.getVariant()
                                .getProduct()
                                .getProductName();

                table.addCell(
                        new Phrase(productName)
                );

                table.addCell(
                        new Phrase(
                                String.valueOf(
                                        item.getQuantity()
                                )
                        )
                );

                table.addCell(
                        new Phrase(
                                "Rs. "
                                        + item.getUnitPrice()
                        )
                );

                table.addCell(
                        new Phrase(
                                "Rs. "
                                        + item.getDiscount()
                        )
                );

                BigDecimal subtotal =
                        item.getFinalPrice()
                                .multiply(
                                        BigDecimal.valueOf(
                                                item.getQuantity()
                                        )
                                );

                table.addCell(
                        new Phrase(
                                "Rs. "
                                        + subtotal
                        )
                );
            }

            document.add(table);

            document.add(new Paragraph(" "));

            document.add(
                    new Paragraph(
                            "TOTAL: Rs. "
                                    + order.getTotalAmount()
                    )
            );

            document.add(new Paragraph(" "));

            document.add(
                    new Paragraph(
                            "Thank you for shopping with us!"
                    )
            );

            document.close();

            return outputStream.toByteArray();

        } catch (DocumentException e) {

            throw new RuntimeException(
                    "Failed to generate order invoice PDF",
                    e
            );
        }
    }
}