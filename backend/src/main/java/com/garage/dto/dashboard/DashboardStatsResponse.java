package com.garage.dto.dashboard;

public class DashboardStatsResponse {
    private long totalParts;
    private long totalStockIn;
    private long totalStockOut;
    private long totalTransactions;
    private long lowStockCount;
    private long openJobs;
    private long inProgressJobs;
    private long completedToday;

    public DashboardStatsResponse() {}

    public DashboardStatsResponse(long totalParts, long totalStockIn, long totalStockOut, long totalTransactions, long lowStockCount, long openJobs, long inProgressJobs, long completedToday) {
        this.totalParts = totalParts;
        this.totalStockIn = totalStockIn;
        this.totalStockOut = totalStockOut;
        this.totalTransactions = totalTransactions;
        this.lowStockCount = lowStockCount;
        this.openJobs = openJobs;
        this.inProgressJobs = inProgressJobs;
        this.completedToday = completedToday;
    }

    public long getTotalParts() { return totalParts; }
    public void setTotalParts(long totalParts) { this.totalParts = totalParts; }
    public long getTotalStockIn() { return totalStockIn; }
    public void setTotalStockIn(long totalStockIn) { this.totalStockIn = totalStockIn; }
    public long getTotalStockOut() { return totalStockOut; }
    public void setTotalStockOut(long totalStockOut) { this.totalStockOut = totalStockOut; }
    public long getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; }
    public long getLowStockCount() { return lowStockCount; }
    public void setLowStockCount(long lowStockCount) { this.lowStockCount = lowStockCount; }
    public long getOpenJobs() { return openJobs; }
    public void setOpenJobs(long openJobs) { this.openJobs = openJobs; }
    public long getInProgressJobs() { return inProgressJobs; }
    public void setInProgressJobs(long inProgressJobs) { this.inProgressJobs = inProgressJobs; }
    public long getCompletedToday() { return completedToday; }
    public void setCompletedToday(long completedToday) { this.completedToday = completedToday; }
}
