"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Calendar,
  Edit3,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import BillingService, {
  PaymentMethod,
  Invoice,
  Subscription,
} from "../../../lib/utils/billingService";
import { toast } from "../../../hooks/use-toast";
import { useRouter } from "next/navigation";

const BillingSettingsPage: React.FC = () => {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvc: "",
    name: "",
  });

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after component unmounts

    const fetchData = async () => {
      try {
        // Only update state if component is still mounted
        if (isMounted) {
          setLoading(true);
        }

        const [subscriptionData, invoicesData, paymentMethodsData] =
          await Promise.all([
            BillingService.getCurrentSubscription().catch((err) => {
              console.error("Error fetching subscription data:", err);
              // Return null as fallback
              return null;
            }),
            BillingService.getBillingHistory().catch((err) => {
              console.error("Error fetching billing history:", err);
              // Return empty array as fallback
              return [];
            }),
            BillingService.getPaymentMethods().catch((err) => {
              console.error("Error fetching payment methods:", err);
              // Return empty array as fallback
              return [];
            }),
          ]);

        // Only update state if component is still mounted
        if (isMounted) {
          setSubscription(subscriptionData);
          setInvoices(invoicesData);
          setPaymentMethods(paymentMethodsData);
        }
      } catch (err: any) {
        console.error("Error fetching billing data:", err);
        // Only update state if component is still mounted
        if (isMounted) {
          setError(err.message || "Failed to load billing data");
          toast({
            title: "Error",
            description: "Failed to load billing data. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddPaymentMethod = async () => {
    try {
      // Validate card number (simple validation)
      if (newPaymentMethod.cardNumber.length < 16) {
        toast({
          title: "Error",
          description: "Please enter a valid card number",
          variant: "destructive",
        });
        return;
      }

      // Validate expiry date
      const month = parseInt(newPaymentMethod.expiryMonth);
      const year = parseInt(newPaymentMethod.expiryYear);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      if (isNaN(month) || month < 1 || month > 12) {
        toast({
          title: "Error",
          description: "Please enter a valid expiry month",
          variant: "destructive",
        });
        return;
      }

      if (
        isNaN(year) ||
        year < currentYear ||
        (year === currentYear && month < currentMonth)
      ) {
        toast({
          title: "Error",
          description: "Please enter a valid expiry date",
          variant: "destructive",
        });
        return;
      }

      // Determine card type based on number (simplified)
      let cardType: "visa" | "mastercard" | "amex" | "paypal" = "visa";
      if (newPaymentMethod.cardNumber.startsWith("4")) {
        cardType = "visa";
      } else if (newPaymentMethod.cardNumber.startsWith("5")) {
        cardType = "mastercard";
      } else if (newPaymentMethod.cardNumber.startsWith("3")) {
        cardType = "amex";
      }

      // Add payment method through the service
      const addedMethod = await BillingService.addPaymentMethod({
        type: cardType,
        lastFour: newPaymentMethod.cardNumber.slice(-4),
        expiryMonth: month,
        expiryYear: year,
      }).catch((err) => {
        throw new Error(err.message || "Failed to add payment method");
      });

      setPaymentMethods([...paymentMethods, addedMethod]);
      setShowAddPaymentMethod(false);
      setNewPaymentMethod({
        cardNumber: "",
        expiryMonth: "",
        expiryYear: "",
        cvc: "",
        name: "",
      });

      toast({
        title: "Success",
        description: "Payment method added successfully!",
      });
    } catch (err: any) {
      console.error("Error adding payment method:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to add payment method",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Set default payment method through the service
      const updatedMethod = await BillingService.setDefaultPaymentMethod(
        id,
      ).catch((err) => {
        throw new Error(
          err.message || "Failed to update default payment method",
        );
      });

      // Update local state
      setPaymentMethods(
        paymentMethods.map((pm) => ({
          ...pm,
          isDefault: pm.id === id,
        })),
      );

      // Use the value of updatedMethod
      console.log(updatedMethod);

      toast({
        title: "Success",
        description: "Default payment method updated!",
      });
    } catch (err: any) {
      console.error("Error setting default payment method:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update default payment method",
        variant: "destructive",
      });
    }
  };

  const handleRemovePaymentMethod = async (id: string) => {
    try {
      // Remove payment method through the service
      await BillingService.removePaymentMethod(id).catch((err) => {
        throw new Error(err.message || "Failed to remove payment method");
      });

      // Update local state
      setPaymentMethods(paymentMethods.filter((pm) => pm.id !== id));

      toast({
        title: "Success",
        description: "Payment method removed!",
      });
    } catch (err: any) {
      console.error("Error removing payment method:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to remove payment method",
        variant: "destructive",
      });
    }
  };

  const handleChangePlan = async () => {
    try {
      // Navigate to subscription page to change plan
      router.push("billing/subscription");
    } catch (err: any) {
      console.error("Error changing plan:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to change plan",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      const result = await BillingService.updatePaymentMethod().catch((err) => {
        throw new Error(err.message || "Failed to update payment method");
      });
      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err: any) {
      console.error("Error updating payment method:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update payment method",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = async () => {
    try {
      if (
        window.confirm("Are you sure you want to cancel your subscription?")
      ) {
        const result = await BillingService.cancelSubscription(
          "User requested cancellation",
        );
        if (result.success) {
          // Refresh subscription data
          const subscriptionData =
            await BillingService.getCurrentSubscription();
          setSubscription(subscriptionData);

          toast({
            title: "Success",
            description: "Subscription cancelled successfully!",
          });
        } else {
          throw new Error(result.message || "Failed to cancel subscription");
        }
      }
    } catch (err: any) {
      console.error("Error cancelling subscription:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  };

  const getCardIcon = (type: string) => {
    switch (type) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💳";
      case "paypal":
        return "🅿️";
      default:
        return "💳";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Paid
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-black text-xs rounded-full">
            Unknown
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full py-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-red-800 font-medium">Error Loading Data</h3>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const nextBillingDate = subscription?.subscription?.current_period_end
    ? new Date(subscription.subscription.current_period_end)
    : null;

  return (
    <div className="w-full py-6 bg-background">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription, payment methods, and billing history
        </p>
      </div>

      <div className="space-y-6">
        {/* Payment Methods */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">
                Payment Methods
              </h2>
              <button
                onClick={() => setShowAddPaymentMethod(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Payment Method
              </button>
            </div>
          </div>

          <div className="p-6">
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  No payment methods
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by adding a new payment method.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddPaymentMethod(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </button>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {paymentMethods.map((method) => (
                  <li key={method.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">
                          {getCardIcon(method.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {method.type.charAt(0).toUpperCase() +
                              method.type.slice(1)}{" "}
                            ending in {method.lastFour}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        </div>
                        {method.isDefault && (
                          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {!method.isDefault && (
                          <button
                            onClick={() => handleSetDefault(method.id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            Set as default
                          </button>
                        )}
                        <button
                          onClick={() => handleRemovePaymentMethod(method.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-700">
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Add Payment Method Modal */}
        {showAddPaymentMethod && (
          <div className="fixed inset-0 bg-background/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-lg max-w-md w-full p-6 border border-border">
              <h3 className="text-lg font-medium text-foreground mb-4">
                Add Payment Method
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={newPaymentMethod.cardNumber}
                    onChange={(e) =>
                      setNewPaymentMethod({
                        ...newPaymentMethod,
                        cardNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-foreground"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Expiry Month
                    </label>
                    <input
                      type="text"
                      value={newPaymentMethod.expiryMonth}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          expiryMonth: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-foreground"
                      placeholder="MM"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Expiry Year
                    </label>
                    <input
                      type="text"
                      value={newPaymentMethod.expiryYear}
                      onChange={(e) =>
                        setNewPaymentMethod({
                          ...newPaymentMethod,
                          expiryYear: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-foreground"
                      placeholder="YYYY"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={newPaymentMethod.cvc}
                    onChange={(e) =>
                      setNewPaymentMethod({
                        ...newPaymentMethod,
                        cvc: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-foreground"
                    placeholder="123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={newPaymentMethod.name}
                    onChange={(e) =>
                      setNewPaymentMethod({
                        ...newPaymentMethod,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-foreground"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddPaymentMethod(false)}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted">
                  Cancel
                </button>
                <button
                  onClick={handleAddPaymentMethod}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Billing History
            </h2>
          </div>

          <div className="p-6">
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  No billing history
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your billing history will appear here once you have payments.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        Description
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                          {invoice.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          ${invoice.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {invoice.receiptUrl ? (
                            <a
                              href={invoice.receiptUrl}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              target="_blank"
                              rel="noopener noreferrer">
                              Download
                            </a>
                          ) : (
                            <span className="text-black">No receipt</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-center">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                View All Invoices
              </button>
            </div>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Subscription Management
            </h2>
          </div>

          <div className="p-6">
            {subscription ? (
              <div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-6">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {subscription.plan.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Billed monthly at ${subscription.plan.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    {nextBillingDate && (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Next billing date
                        </p>
                        <p className="font-medium text-foreground">
                          {nextBillingDate.toLocaleDateString()}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleChangePlan}
                    className="flex items-center px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Change Plan
                  </button>
                  <button
                    onClick={handleUpdatePaymentMethod}
                    className="flex items-center px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Update Payment Method
                  </button>
                  {subscription.subscription?.status === "active" && (
                    <button
                      onClick={handleCancelSubscription}
                      className="flex items-center px-4 py-2 bg-background border border-red-300 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
                <h3 className="mt-2 text-sm font-medium text-foreground">
                  Loading subscription data
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettingsPage;
